# -*- coding: utf-8 -*-
# config_files/api/runtime.py
from __future__ import annotations
from app.crew.tools import qdrant_tool 
from app.crew.agents import build_llm, define_agents
from app.pdf_report import SessionMemory

TOOL = qdrant_tool
LLM = build_llm()
SUMMARY_AGENT, QA_AGENT, QUIZ_AGENT, FEEDBACK_AGENT = define_agents(TOOL)
# simple session memory you already use in pdf_report.py
GLOBAL_MEM = SessionMemory()
