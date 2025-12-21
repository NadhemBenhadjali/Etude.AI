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
        raise ValidationError("ELEVENLABS_API_KEY is not configured", {"service": "tts"})

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
    except CircuitBreakerOpen as e:
        logger.warning("tts_circuit_open", details=e.details)
        raise TTSServiceError("TTS circuit breaker is open", e.details)
    except requests.HTTPError as e:
        code = e.response.status_code if e.response is not None else None
        logger.error("tts_provider_http_error", status_code=code)
        raise TTSServiceError("TTS provider request failed", {"status_code": code})
    except Exception as e:
        logger.error("tts_unexpected_error", error=str(e))
        raise TTSServiceError("TTS failed unexpectedly", {"error": str(e)})
