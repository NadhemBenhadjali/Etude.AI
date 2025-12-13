from __future__ import annotations
import os
import time
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.crew.config import URI, USER, PASSWORD
from app.crew.knowledge_graph import Neo4jKG
from app.pdf_report import render_pdf
from app.handlers import generate_summary_json, handle_qa, generate_quiz_json

from crewai import Crew, Task
from app.runtime import FEEDBACK_AGENT
from google.api_core.exceptions import ResourceExhausted
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.memory_manager import RedisMemoryManager

import structlog

# Prometheus
from prometheus_client import (
    Counter,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

# -------------------------------------------------------------------
# Logging setup
# -------------------------------------------------------------------

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()

# -------------------------------------------------------------------
# Prometheus metrics
# -------------------------------------------------------------------

REQUEST_COUNT = Counter(
    "ai_pipeline_requests_total",
    "Total HTTP requests to AI Pipeline",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "ai_pipeline_request_duration_seconds",
    "Request latency in seconds for AI Pipeline",
    ["method", "path"],
)

# -------------------------------------------------------------------
# FastAPI app + rate limiting
# -------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Where to serve saved JSON/Reports from:
LESSONS_DIR = "lessons"
REPORTS_DIR = "reports"
os.makedirs(LESSONS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/lessons", StaticFiles(directory=LESSONS_DIR), name="lesson_files")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# -------------------------------------------------------------------
# Logging + metrics middleware
# -------------------------------------------------------------------

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    method = request.method
    path = request.url.path
    status_code = response.status_code

    # Structlog HTTP log
    logger.info(
        "http_request",
        method=method,
        path=path,
        status_code=status_code,
        process_time=process_time,
    )

    # Prometheus metrics
    try:
        REQUEST_COUNT.labels(
            method=method,
            path=path,
            status=status_code,
        ).inc()
        REQUEST_LATENCY.labels(
            method=method,
            path=path,
        ).observe(process_time)
    except Exception:
        # Never let metrics crash the request
        pass

    return response

# -------------------------------------------------------------------
# Dependencies
# -------------------------------------------------------------------

neo_kg = Neo4jKG(URI, USER, PASSWORD)
memory_manager = RedisMemoryManager()

# -------------------------------------------------------------------
# Health + Metrics
# -------------------------------------------------------------------

@app.get("/health")
async def health():
    checks = {
        "status": "ok",
        "dependencies": {}
    }

    # Check Neo4j
    try:
        with neo_kg.driver.session() as session:
            session.run("RETURN 1")
        checks["dependencies"]["neo4j"] = "up"
    except Exception as e:
        checks["dependencies"]["neo4j"] = f"down: {str(e)}"
        checks["status"] = "degraded"

    # Check Redis
    try:
        memory_manager.client.ping()
        checks["dependencies"]["redis"] = "up"
    except Exception as e:
        checks["dependencies"]["redis"] = f"down: {str(e)}"
        checks["status"] = "degraded"

    # Check Qdrant
    import requests
    qdrant_url = os.getenv("QDRANT_URL")
    if qdrant_url:
        try:
            resp = requests.get(f"{qdrant_url}/readiness", timeout=2)
            if resp.status_code == 200:
                checks["dependencies"]["qdrant"] = "up"
            else:
                checks["dependencies"]["qdrant"] = f"down (status {resp.status_code})"
                checks["status"] = "degraded"
        except Exception as e:
            checks["dependencies"]["qdrant"] = f"down: {str(e)}"
            checks["status"] = "degraded"

    return checks


@app.get("/metrics")
async def metrics():
    """
    Prometheus scrape endpoint.
    Prometheus will call this instead of getting 404.
    """
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def get_session_id(request: Request) -> str:
    sid = request.headers.get("X-Session-ID")
    if not sid:
        sid = "default_session"
    return sid

# -------------------------------------------------------------------
# Business endpoints
# -------------------------------------------------------------------

@app.post(
    "/summary",
    summary="Generate Lesson Summary",
    description="Generates a detailed lesson summary using the AI Multi-Agent system.",
    tags=["AI Content"],
)
@limiter.limit("5/minute")
async def summary_endpoint(request: Request):
    session_id = get_session_id(request)
    body = await request.json()
    mod = body.get("module", "").strip()
    if not mod:
        return JSONResponse({"error": "module is required"}, status_code=400)
    try:
        user_in = f"ملخص محور {mod}"
        result = generate_summary_json(user_in, neo_kg)
        memory_manager.log_event(session_id, "chapter_summary", result["data"])
        return JSONResponse(result)
    except LookupError as e:
        return JSONResponse({"error": str(e)}, status_code=404)
    except Exception as e:
        return JSONResponse(
            {"error": "internal failure", "details": str(e)},
            status_code=500,
        )


@app.post(
    "/qa",
    summary="Ask Question",
    description="Answers a student question based on the curriculum knowledge base.",
    tags=["AI Content"],
)
@limiter.limit("10/minute")
async def qa_endpoint(request: Request):
    session_id = get_session_id(request)
    body = await request.json()
    question = body.get("question", "").strip()
    if not question:
        return JSONResponse({"error": "question is required"}, status_code=400)

    try:
        qa_memory = memory_manager.get_session_memory(session_id)
        answer = handle_qa(question, neo_kg, qa_memory)

        memory_manager.log_event(
            session_id,
            "qa_interaction",
            {"q": question, "a": answer["result"]},
        )

        return JSONResponse(answer)

    except ResourceExhausted:
        return JSONResponse(
            {
                "error": "llm_rate_limited",
                "message": "توا ما نجمش نجاوبك، الكوتا متاع خدمة Gemini تستهلكت. جرّب بعد شوية ولا نهار آخر."
            },
            status_code=429,
        )
    except LookupError as e:
        return JSONResponse({"error": str(e)}, status_code=404)
    except Exception as e:
        return JSONResponse(
            {
                "error": "internal_failure",
                "details": str(e),
            },
            status_code=500,
        )



@app.post(
    "/quiz",
    summary="Generate Quiz",
    description="Creates a quiz with multiple choice and true/false questions.",
    tags=["AI Content"],
)
@limiter.limit("5/minute")
async def quiz_endpoint(request: Request):
    session_id = get_session_id(request)
    body = await request.json()
    module = body.get("module", "").strip()
    num_mc = int(body.get("num_mc", 6))
    num_tf = int(body.get("num_tf", 4))
    if not module:
        return JSONResponse({"error": "module is required"}, status_code=400)
    try:
        result = generate_quiz_json(
            module,
            neo_kg,
            num_mc=num_mc,
            num_tf=num_tf,
        )
        memory_manager.log_event(
            session_id,
            "quiz_log",
            result["data"]["questions"],
        )
        return JSONResponse(result)
    except LookupError as e:
        return JSONResponse({"error": str(e)}, status_code=404)
    except Exception as e:
        return JSONResponse(
            {"error": "internal failure", "details": str(e)},
            status_code=500,
        )


@app.post(
    "/finish",
    summary="Finish Session",
    description="Generates a PDF report and feedback for the session.",
    tags=["Session Management"],
)
async def finish(request: Request):
    session_id = get_session_id(request)
    session_data = memory_manager.get_session_data(session_id)

    parts: list[str] = []
    if "chapter_summary" in session_data:
        parts.append("ملخّص الدرس:\n" + str(session_data["chapter_summary"]))

    qa_memory = memory_manager.get_session_memory(session_id)
    chat_history_messages = qa_memory.chat_memory.messages
    if chat_history_messages:
        qa_lines: list[str] = []
        for i in range(0, len(chat_history_messages), 2):
            if i + 1 < len(chat_history_messages):
                q = chat_history_messages[i].content
                a = chat_history_messages[i + 1].content
                qa_lines.append(f" {q}\n {a}")
        if qa_lines:
            parts.append("الأسئلة و الأجوبة:\n" + "\n".join(qa_lines))

    if "quiz_log" in session_data:
        quiz_data = session_data["quiz_log"]
        if isinstance(quiz_data, str):
            import json
            try:
                quiz_data = json.loads(quiz_data)
            except Exception:
                pass
        if isinstance(quiz_data, list):
            quiz_lines = [
                f"{i + 1}) {q.get('q')} – الصحيح: {q.get('a')}"
                for i, q in enumerate(quiz_data)
            ]
            parts.append("تفاصيل الاختبار:\n" + "\n".join(quiz_lines))

    fb_prompt = (
        "أنت أخصّائي متابعة تعلم.\n"
        + "\n---\n".join(parts)
        + "\nاكتب رسالة تشجيعية قصيرة باللهجة التونسية."
    )
    fb_task = Task(
        description=fb_prompt,
        expected_output="رسالة تشجيعية",
        agent=FEEDBACK_AGENT,
    )
    fb_note = Crew(
        agents=[FEEDBACK_AGENT],
        tasks=[fb_task],
        verbose=False,
    ).kickoff().raw

    session_data["feedback_note"] = fb_note

    pdf_path = Path(REPORTS_DIR) / f"session_report_{session_id}.pdf"
    render_pdf(session_data, pdf_path)

    return JSONResponse(
        {"pdf_url": f"/reports/session_report_{session_id}.pdf"}
    )
