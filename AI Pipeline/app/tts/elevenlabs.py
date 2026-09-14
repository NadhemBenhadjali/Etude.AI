import os
import requests
import structlog

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

from app.circuit_breaker import CircuitBreakerOpen, tts_circuit
from app.exceptions import TTSServiceError, ValidationError

logger = structlog.get_logger()

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"


def _should_retry(exc: Exception) -> bool:
    # Retry on network issues, timeouts, 429, and 5xx
    if isinstance(exc, (requests.Timeout, requests.ConnectionError)):
        return True
    if isinstance(exc, requests.HTTPError) and exc.response is not None:
        code = exc.response.status_code
        return code == 429 or code >= 500
    return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    retry=retry_if_exception(_should_retry),
    reraise=True,
)
def _call_elevenlabs(
    *,
    api_key: str,
    text: str,
    voice_id: str,
    model_id: str,
    stability: float,
    similarity_boost: float,
    timeout_seconds: float,
) -> bytes:
    url = f"{ELEVENLABS_BASE_URL}/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
        },
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=timeout_seconds)
    if resp.status_code >= 400:
        # Raise HTTPError with response attached
        resp.raise_for_status()
    return resp.content


import io
import asyncio

def _synthesize_edge_or_gtts(text: str) -> bytes:
    """Fallback TTS using edge-tts or gTTS."""
    try:
        import edge_tts
        async def _run_edge():
            # High-quality natural Arabic voice (Tunisian / Standard Arabic)
            communicate = edge_tts.Communicate(text, "ar-TN-ReemNeural")
            audio_bytes = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes.extend(chunk["data"])
            if not audio_bytes:
                # Fallback to Salma or Hamed
                communicate = edge_tts.Communicate(text, "ar-EG-SalmaNeural")
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_bytes.extend(chunk["data"])
            return bytes(audio_bytes)
        
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import nest_asyncio
                nest_asyncio.apply()
            return loop.run_until_complete(_run_edge())
        except Exception:
            return asyncio.run(_run_edge())
    except Exception as edge_err:
        logger.warning("edge_tts_fallback_failed", error=str(edge_err))
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang='ar', slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as gtts_err:
            logger.error("all_tts_fallbacks_failed", error=str(gtts_err))
            raise TTSServiceError("TTS failed", {"error": str(gtts_err)})


def synthesize_tts_bytes(
    *,
    text: str,
    voice_id: str,
    model_id: str,
    stability: float,
    similarity_boost: float,
) -> bytes:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.info("elevenlabs_not_configured_using_fallback_tts")
        return _synthesize_edge_or_gtts(text)

    timeout_seconds = float(os.getenv("TTS_TIMEOUT_SECONDS", "15"))

    # Circuit breaker wraps the provider call
    try:
        return tts_circuit.call(
            lambda: _call_elevenlabs(
                api_key=api_key,
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                stability=stability,
                similarity_boost=similarity_boost,
                timeout_seconds=timeout_seconds,
            )
        )
    except Exception as e:
        logger.warning("elevenlabs_call_failed_falling_back", error=str(e))
        return _synthesize_edge_or_gtts(text)
