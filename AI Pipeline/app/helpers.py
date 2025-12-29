import json
import re
import math
import structlog
from typing import List
import threading

import arabic_reshaper
from bidi.algorithm import get_display
import google.generativeai as genai
import litellm
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.crew.config import settings
from app.exceptions import EmbeddingError, InvalidResponseError

logger = structlog.get_logger()
_configured = False
_config_lock = threading.Lock()

# Import circuit breaker and cache (will be initialized lazily)
_embedding_cache = None
_llm_circuit = None


def _get_embedding_cache():
    """Lazy initialization of embedding cache."""
    global _embedding_cache
    if _embedding_cache is None:
        try:
            from app.memory_manager import RedisMemoryManager
            from app.embedding_cache import EmbeddingCache
            redis_manager = RedisMemoryManager()
            _embedding_cache = EmbeddingCache(redis_manager)
        except Exception as e:
            logger.warning("embedding_cache_init_failed", error=str(e))
            _embedding_cache = None
    return _embedding_cache


def _get_llm_circuit():
    """Lazy initialization of LLM circuit breaker."""
    global _llm_circuit
    if _llm_circuit is None:
        try:
            from app.circuit_breaker import llm_circuit
            _llm_circuit = llm_circuit
        except Exception as e:
            logger.warning("llm_circuit_init_failed", error=str(e))
            _llm_circuit = None
    return _llm_circuit


def _clean_user_question(raw: str) -> str:
    l = raw.strip().lower()
    return raw.split(':', 1)[1].strip() if l.startswith(('سؤال:', 'qa:')) else raw.strip()

def _clean_json_block(text: str) -> str:
    cleaned = re.sub(r"```[a-zA-Z]*\n?", "", text).strip()
    return cleaned.strip("`").strip()

def _extract_final_answer(text: str) -> str:
    """
    Extract the final answer from ReAct framework output.

    When agents use tools, they output in this format:
    Thought: ...
    Action: ...
    Action Input: ...
    Observation: ...
    Thought: ...
    Final Answer: <the actual answer>

    This function extracts only the final answer part.
    If no "Final Answer:" marker is found, returns the original text.

    Args:
        text: Raw agent output

    Returns:
        Extracted final answer or original text
    """
    # Try to find "Final Answer:" marker (case-insensitive, handles variations)
    patterns = [
        r"Final Answer:\s*(.*)",
        r"النتيجة النهائية:\s*(.*)",
        r"الإجابة النهائية:\s*(.*)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            answer = match.group(1).strip()
            # Remove any trailing markers or formatting
            answer = re.sub(r"\n*(Thought|Action|Observation):.*$", "", answer, flags=re.IGNORECASE | re.DOTALL)
            return answer.strip()

    # If no Final Answer marker found, check if the text contains ReAct markers
    # If it does, log a warning and return cleaned text
    if re.search(r"(Thought|Action|Observation):", text, re.IGNORECASE):
        logger.warning("react_output_without_final_answer", text_snippet=text[:200])
        # Try to extract last meaningful text before any ReAct markers
        lines = text.split('\n')
        clean_lines = []
        for line in reversed(lines):
            if not re.match(r"^\s*(Thought|Action|Observation|Action Input):", line, re.IGNORECASE):
                clean_lines.insert(0, line)
            else:
                break
        if clean_lines:
            return '\n'.join(clean_lines).strip()

    # No ReAct markers found, return original text
    return text.strip()

def parse_quiz_json(raw_text: str):
    """
    Parse quiz JSON from LLM response with robust error handling.

    Args:
        raw_text: Raw LLM output containing JSON

    Returns:
        Parsed dictionary or None if parsing fails

    Note: Does NOT use ast.literal_eval for security reasons
    """
    cleaned = _clean_json_block(raw_text).replace("'", '"')
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(
            "json_parse_failed",
            error=str(e),
            text_snippet=cleaned[:200],
            position=e.pos if hasattr(e, 'pos') else None
        )
        raise InvalidResponseError(
            "LLM returned invalid JSON for quiz",
            details={"error": str(e), "snippet": cleaned[:200]}
        )

def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    n1 = math.sqrt(sum(x * x for x in a))
    n2 = math.sqrt(sum(y * y for y in b))
    return dot / (n1 * n2) if n1 and n2 else 0.0

def strip_unsupported(text: str) -> str:
    """
    Remove any character that is not:
      - Arabic letters (U+0600–U+06FF)
      - Basic Latin letters/digits/punctuation (U+0000–U+007F)
      - Common Arabic punctuation: ، ؟ ! - (and space)
    This effectively strips emojis and other symbols that the Arabic font cannot render.
    """
    # Allow U+0600.U+06FF (Arabic), U+0000..U+007F (Basic Latin),
    # and the Arabic comma (U+060C) and question mark (U+061F) and exclamation (U+0021) and dash/hyphen.
    return re.sub(r"[^\u0000-\u007F\u0600-\u06FF\u060C\u061F!\s\-]", "", text)

def rtl(text: str) -> str:
    """Reshape & reorder Arabic for proper RTL display."""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

def configure_gemini():
    # Configure the Gemini client with the Google key (not the Mistral key)
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    elif settings.CHROMA_GOOGLE_GENAI_API_KEY:
        genai.configure(api_key=settings.CHROMA_GOOGLE_GENAI_API_KEY)
    else:
        logger.warning("GEMINI_API_KEY is not set; Google embedding calls will fail.")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    reraise=True,
)
def embed(text: str, use_cache: bool = True) -> List[float]:
    """
    Generate embeddings with caching, circuit breaker, and retry logic.

    Args:
        text: Text to embed (max 8000 characters for safety)
        use_cache: Whether to use Redis cache (default True)

    Returns:
        List of embedding floats

    Raises:
        EmbeddingError: If embedding generation fails after retries
    """
    # Validate input length
    if not text or not text.strip():
        raise EmbeddingError("Cannot embed empty text")

    if len(text) > 8000:
        logger.warning("text_too_long_for_embedding", length=len(text))
        text = text[:8000]  # Truncate instead of failing

    model = settings.EMBEDDING_MODEL

    # Try cache first
    if use_cache:
        cache = _get_embedding_cache()
        if cache:
            cached_embedding = cache.get(text, model)
            if cached_embedding:
                return cached_embedding

    # Define the embedding generation function
    def _generate_embedding() -> List[float]:
        try:
            # Check explicitly for Mistral to use os.environ key mapping we set up in config.py
            if "mistral" in model:
                response = litellm.embedding(
                    model=model,
                    input=[text],
                    api_key=settings.MISTRAL_API_KEY,
                    timeout=15.0,  # 15 second timeout
                )
                embedding = response["data"][0]["embedding"]
                logger.debug("embedding_generated", model=model, dim=len(embedding))
                return embedding

            # Legacy for Google text-embedding-004
            if model == "gemini/text-embedding-004":
                configure_gemini()
                res = genai.embed_content(model=model, content=text)
                emb = res.get("embedding")

                # Handle different response formats
                if isinstance(emb, dict) and "values" in emb:
                    embedding = emb["values"]
                else:
                    embedding = emb

                if not embedding or not isinstance(embedding, list):
                    raise EmbeddingError(
                        "Invalid embedding response from Gemini",
                        details={"response": str(res)[:200]}
                    )

                logger.debug("embedding_generated", model=model, dim=len(embedding))
                return embedding

            # Default fallback to litellm for any other provider
            response = litellm.embedding(
                model=model,
                input=[text],
                timeout=15.0,
            )
            embedding = response["data"][0]["embedding"]
            logger.debug("embedding_generated", model=model, dim=len(embedding))
            return embedding

        except Exception as e:
            logger.error("embedding_failed", model=model, error=str(e), text_length=len(text))
            raise EmbeddingError(
                f"Failed to generate embedding: {str(e)}",
                details={"model": model, "error_type": type(e).__name__}
            )

    # Execute with circuit breaker protection
    try:
        circuit = _get_llm_circuit()
        if circuit:
            embedding = circuit.call(_generate_embedding)
        else:
            embedding = _generate_embedding()

        # Cache the result
        if use_cache and embedding:
            cache = _get_embedding_cache()
            if cache:
                cache.set(text, model, embedding)

        return embedding

    except Exception as e:
        # Re-raise as EmbeddingError if not already
        if not isinstance(e, EmbeddingError):
            raise EmbeddingError(
                f"Failed to generate embedding: {str(e)}",
                details={"model": model, "error_type": type(e).__name__}
            )
        raise
