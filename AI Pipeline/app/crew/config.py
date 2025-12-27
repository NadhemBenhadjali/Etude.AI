import os
import re
from pathlib import Path
from pydantic_settings import BaseSettings
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    # Environment
    TESSDATA_PREFIX: str = "/usr/share/tesseract-ocr/5/tessdata"

    # AI Keys
    LLM_API_KEY: str  # used for Mistral LLM
    GEMINI_API_KEY: str = ""  # used for Google embeddings (LiteLLM expects GEMINI_API_KEY)
    CHROMA_GOOGLE_GENAI_API_KEY: str = ""  # legacy alias (optional)

    # AI Models
    LLM_MODEL: str = "mistral/mistral-large-latest"
    # IMPORTANT: must be 768-dim to match your existing Qdrant collection
    EMBEDDING_MODEL: str = "gemini/text-embedding-004"
    MISTRAL_API_KEY: str = ""

    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str = ""  # Optional - not needed for local Docker

    # Neo4j
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    # ElevenLabs TTS
    ELEVENLABS_API_KEY: str

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Sentry (Observability)
    SENTRY_DSN: str | None = None
    ENVIRONMENT: str = "development"
    RELEASE_VERSION: str = "unknown"

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"

    def __init__(self, **data):
        super().__init__(**data)

        # Backward compatibility: allow either env var name for the Google key
        if not self.GEMINI_API_KEY and self.CHROMA_GOOGLE_GENAI_API_KEY:
            self.GEMINI_API_KEY = self.CHROMA_GOOGLE_GENAI_API_KEY
        if not self.CHROMA_GOOGLE_GENAI_API_KEY and self.GEMINI_API_KEY:
            self.CHROMA_GOOGLE_GENAI_API_KEY = self.GEMINI_API_KEY


# Initialize Settings
settings = Settings()

# --- Apply to Environment for libraries that rely on os.environ ---
os.environ["TESSDATA_PREFIX"] = settings.TESSDATA_PREFIX

# Mistral (LLM)
os.environ["LLM_API_KEY"] = settings.LLM_API_KEY
os.environ["MISTRAL_API_KEY"] = settings.LLM_API_KEY

# Google (Embeddings via LiteLLM Gemini provider)
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    # some Google SDKs also read GOOGLE_API_KEY
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

# Keep legacy var too, if something else in your stack uses it
os.environ["CHROMA_GOOGLE_GENAI_API_KEY"] = settings.CHROMA_GOOGLE_GENAI_API_KEY

# Qdrant
os.environ["QDRANT_URL"] = settings.QDRANT_URL
os.environ["QDRANT_API_KEY"] = settings.QDRANT_API_KEY
os.environ["MISTRAL_API_KEY"] = settings.MISTRAL_API_KEY

# Models
os.environ["LLM_MODEL"] = settings.LLM_MODEL
os.environ["EMBEDDING_MODEL"] = settings.EMBEDDING_MODEL

#ElevenLabs TTS
os.environ["ELEVENLABS_API_KEY"] = settings.ELEVENLABS_API_KEY


# Export Sentry configuration
if settings.SENTRY_DSN:
    os.environ["SENTRY_DSN"] = settings.SENTRY_DSN
os.environ["ENVIRONMENT"] = settings.ENVIRONMENT
os.environ["RELEASE_VERSION"] = settings.RELEASE_VERSION

# --- Neo4j Credentials ---
URI = settings.NEO4J_URI
USER = settings.NEO4J_USER
PASSWORD = settings.NEO4J_PASSWORD

# --- File Paths & Assets ---
PDF_PATH = "config_files/Book.pdf"
ARABIC_FONT_PATH = "config_files/NotoNaskhArabic-Regular.ttf"
ARABIC_FONT_NAME = "NotoArabic"
IMG_DIR = "config_files/book_images"
MAX_IMG_W = 180
MAX_IMG_H = 140

# Markdown image tag regex
MD_IMG = re.compile(r"!\[(.*?)\]\((.*?)\)")

# Register the Arabic font safely
try:
    pdfmetrics.registerFont(TTFont(ARABIC_FONT_NAME, ARABIC_FONT_PATH))
except Exception as e:
    print(f"Warning: Could not register font {ARABIC_FONT_PATH}. Ensure file exists. Error: {e}")

# CrewAI embedder config (if you use it anywhere)
embedder_cfg = {
    "provider": "google-generativeai",
    "config": {
        "api_key": settings.GEMINI_API_KEY,
        "model_name": "models/text-embedding-004",
    },
}
