# AI Pipeline/app/runtime.py

# -*- coding: utf-8 -*-
from __future__ import annotations

from crewai_tools import QdrantVectorSearchTool

from app.crew.agents import build_llm, define_agents
from app.pdf_report import SessionMemory
from app.crew.config import settings  # Import the new settings
from app.helpers import embed, configure_gemini

# Configure Gemini once at startup so embed() has a valid API key
configure_gemini()

TOOL = QdrantVectorSearchTool(
    qdrant_url=settings.QDRANT_URL,
    qdrant_api_key=settings.QDRANT_API_KEY,
    collection_name="etudeai",
    limit=5,
    score_threshold=0.35,
    custom_embedding_fn=embed,
    check_compatibility=False,
)

LLM = build_llm()
SUMMARY_AGENT, QA_AGENT, QUIZ_AGENT, FEEDBACK_AGENT = define_agents(TOOL)
GLOBAL_MEM = SessionMemory()
