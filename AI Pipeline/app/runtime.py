# AI Pipeline/app/runtime.py

# -*- coding: utf-8 -*-
from __future__ import annotations

from crewai_tools import QdrantVectorSearchTool

from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType

from app.crew.agents import build_llm, define_agents
from app.pdf_report import SessionMemory
from app.crew.config import settings  # Import the new settings
from app.helpers import embed, configure_gemini

try:
    import structlog

    logger = structlog.get_logger()
except Exception:
    import logging

    logger = logging.getLogger(__name__)

# Configure Gemini once at startup so embed() has a valid API key
# configure_gemini()

COLLECTION_NAME = "etudeai"

REQUIRED_KEYWORD_INDEXES = [
    "lesson",
    "module",
    "topic",
    "branch",
    "subject",
    "المحور",
]
REQUIRED_INTEGER_INDEXES = [
    "page",
]


def _get_existing_payload_schema(client: QdrantClient) -> set[str]:
    try:
        info = client.get_collection(COLLECTION_NAME)
        schema = getattr(info, "payload_schema", None) or {}
        return set(schema.keys())
    except Exception as e:
        logger.warning("qdrant_get_collection_failed", error=str(e))
        return set()


def ensure_qdrant_payload_indexes() -> None:
    if not settings.QDRANT_URL:
        logger.warning("qdrant_indexing_skipped", reason="missing_qdrant_url")
        return

    try:
        # API key is optional for local Docker deployments
        api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=api_key,
            timeout=15.0,
        )
    except Exception as e:
        logger.warning("qdrant_client_init_failed", error=str(e))
        return

    existing = _get_existing_payload_schema(client)

    def create_if_missing(field: str, schema: PayloadSchemaType) -> None:
        nonlocal existing

        if field in existing:
            logger.info("qdrant_index_exists", field=field, schema=str(schema))
            return

        try:
            client.create_payload_index(COLLECTION_NAME, field, schema)
            logger.info("qdrant_index_created", field=field, schema=str(schema))
            existing.add(field)
        except Exception as e:
            msg = str(e).lower()
            if "already exists" in msg or "exists" in msg or "409" in msg:
                logger.info("qdrant_index_exists", field=field, schema=str(schema))
                existing.add(field)
                return
            logger.warning(
                "qdrant_index_create_failed",
                field=field,
                schema=str(schema),
                error=str(e),
            )

    for f in REQUIRED_INTEGER_INDEXES:
        create_if_missing(f, PayloadSchemaType.INTEGER)

    for f in REQUIRED_KEYWORD_INDEXES:
        create_if_missing(f, PayloadSchemaType.KEYWORD)


ensure_qdrant_payload_indexes()

# API key is optional for local Docker deployments
qdrant_api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None

TOOL = QdrantVectorSearchTool(
    qdrant_url=settings.QDRANT_URL,
    qdrant_api_key=qdrant_api_key,
    collection_name=COLLECTION_NAME,
    limit=5,
    score_threshold=0.35,
    custom_embedding_fn=embed,
    check_compatibility=False,
)

LLM = build_llm()
SUMMARY_AGENT, QA_AGENT, QUIZ_AGENT, FEEDBACK_AGENT = define_agents(TOOL)
GLOBAL_MEM = SessionMemory()
