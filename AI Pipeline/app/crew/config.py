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
    TESSDATA_PREFIX: str = '/usr/share/tesseract-ocr/5/tessdata'

    # AI Keys
    GEMINI_API_KEY: str
    CHROMA_GOOGLE_GENAI_API_KEY: str = ""

    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # Neo4j
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    # Ngrok
    NGROK_AUTH_TOKEN: str | None = None

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"


    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.CHROMA_GOOGLE_GENAI_API_KEY:
            self.CHROMA_GOOGLE_GENAI_API_KEY = self.GEMINI_API_KEY


# Initialize Settings
settings = Settings()

# --- Apply to Environment for libraries that rely on os.environ ---
os.environ['TESSDATA_PREFIX'] = settings.TESSDATA_PREFIX
os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
os.environ["CHROMA_GOOGLE_GENAI_API_KEY"] = settings.CHROMA_GOOGLE_GENAI_API_KEY
os.environ["QDRANT_URL"] = settings.QDRANT_URL
os.environ["QDRANT_API_KEY"] = settings.QDRANT_API_KEY

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
MD_IMG = re.compile(r'!\[(.*?)\]\((.*?)\)')

# Register the Arabic font safely
try:
    pdfmetrics.registerFont(TTFont(ARABIC_FONT_NAME, ARABIC_FONT_PATH))
except Exception as e:
    print(f"Warning: Could not register font {ARABIC_FONT_PATH}. Ensure file exists. Error: {e}")

embedder_cfg = {
    "provider": "google-generativeai",
    "config": {
        "api_key": settings.GEMINI_API_KEY,
        "model_name": "text-embedding-004",
    },
}