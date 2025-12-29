import os
import time
from pathlib import Path
import requests
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError
import uuid
from app.crew.config import URI, USER, PASSWORD
from app.crew.knowledge_graph import Neo4jKG
from app.crew.planner_crew import PlannerCrew
from app.pdf_report import render_pdf
from app.handlers import generate_summary_json, handle_qa, generate_quiz_json
from app.models import SummaryRequest, QARequest, QuizRequest, FinishRequest, PlanRequest, TTSRequest
from app.exceptions import (
    EtudeAIException,
    TopicNotFoundError,
    InvalidResponseError,
    LLMQuotaExhaustedError,
    Neo4jConnectionError,
    RedisConnectionError,
    TTSServiceError
)

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
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

from app.tts.elevenlabs import synthesize_tts_bytes


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
# Sentry initialization (optional, based on SENTRY_DSN env var)
# -------------------------------------------------------------------

try:
    from app.sentry_config import init_sentry
    sentry_initialized = init_sentry()
    if sentry_initialized:
        logger.info("sentry_integration_active")
except Exception as e:
    logger.warning("sentry_initialization_skipped", error=str(e))

# -------------------------------------------------------------------
# Prometheus metrics
# -------------------------------------------------------------------

# HTTP Metrics
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

# Business Metrics
SUMMARY_GENERATION_DURATION = Histogram(
    "summary_generation_duration_seconds",
    "Time taken to generate lesson summaries",
    ["topic", "status"],
    buckets=[1, 2, 5, 10, 20, 30, 60],
)

QA_RESPONSE_DURATION = Histogram(
    "qa_response_duration_seconds",
    "Time taken to answer questions",
    ["status"],
    buckets=[0.5, 1, 2, 5, 10, 20],
)

QUIZ_GENERATION_DURATION = Histogram(
    "quiz_generation_duration_seconds",
    "Time taken to generate quizzes",
    ["module", "status"],
    buckets=[2, 5, 10, 20, 30, 60],
)

PLAN_GENERATION_DURATION = Histogram(
    "plan_generation_duration_seconds",
    "Time taken to generate learning plans",
    ["status"],
    buckets=[5, 10, 20, 40, 60, 120],
)

EMBEDDING_DURATION = Histogram(
    "embedding_generation_duration_seconds",
    "Time taken to generate embeddings",
    ["model", "cache_hit"],
    buckets=[0.1, 0.2, 0.5, 1, 2, 5],
)

LLM_TOKEN_USAGE = Counter(
    "llm_tokens_used_total",
    "Total tokens used by LLM",
    ["model", "operation"],
)

ACTIVE_SESSIONS = Gauge(
    "active_sessions_total",
    "Number of active user sessions",
)

CIRCUIT_BREAKER_STATE = Gauge(
    "circuit_breaker_state",
    "Circuit breaker state (0=closed, 1=open, 2=half-open)",
    ["service"],
)

CACHE_HIT_RATE = Counter(
    "cache_operations_total",
    "Cache operations",
    ["operation", "result"],  # operation=embedding, result=hit/miss
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
# Global Exception Handlers
# -------------------------------------------------------------------

@app.exception_handler(EtudeAIException)
async def etude_exception_handler(request: Request, exc: EtudeAIException):
    """Handle domain-specific exceptions with structured responses."""
    status_code = 500

    if isinstance(exc, TopicNotFoundError):
        status_code = 404
    elif isinstance(exc, InvalidResponseError):
        status_code = 502  # Bad Gateway - LLM returned invalid data
    elif isinstance(exc, LLMQuotaExhaustedError):
        status_code = 429
    elif isinstance(exc, (Neo4jConnectionError, RedisConnectionError)):
        status_code = 503

    logger.error(
        "domain_exception",
        exception_type=type(exc).__name__,
        message=exc.message,
        details=exc.details,
        status_code=status_code,
    )

    return JSONResponse(
        status_code=status_code,
        content={
            "error": type(exc).__name__,
            "message": exc.message,
            "details": exc.details,
        }
    )


@app.exception_handler(PydanticValidationError)
async def validation_exception_handler(request: Request, exc: PydanticValidationError):
    """Handle Pydantic validation errors."""
    logger.warning("validation_error", errors=exc.errors())
    return JSONResponse(
        status_code=400,
        content={
            "error": "ValidationError",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI request validation errors (422)."""
    logger.warning("request_validation_error", errors=exc.errors(), body=exc.body)
    return JSONResponse(
        status_code=422,
        content={
            "error": "RequestValidationError",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


@app.exception_handler(ResourceExhausted)
async def resource_exhausted_handler(request: Request, exc: ResourceExhausted):
    """Handle LLM quota exhaustion."""
    logger.error("llm_quota_exhausted", error=str(exc))
    return JSONResponse(
        status_code=429,
        content={
            "error": "llm_rate_limited",
            "message": "توا ما نجمش نجاوبك، الكوتا متاع خدمة Gemini تستهلكت. جرّب بعد شوية ولا نهار آخر."
        }
    )


# -------------------------------------------------------------------
# Health + Metrics
# -------------------------------------------------------------------

@app.get("/health")
async def health():
    """Comprehensive health check for all dependencies."""
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
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    if qdrant_url:
        try:
            headers = {"api-key": qdrant_api_key} if qdrant_api_key else {}
            resp = requests.get(f"{qdrant_url}/healthz", headers=headers, timeout=2)
            if resp.status_code == 200:
                checks["dependencies"]["qdrant"] = "up"
            else:
                checks["dependencies"]["qdrant"] = f"down (status {resp.status_code})"
                checks["status"] = "degraded"
        except Exception as e:
            checks["dependencies"]["qdrant"] = f"down: {str(e)}"
            checks["status"] = "degraded"

    return checks


@app.get("/liveness")
async def liveness():
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if the application is running (can accept traffic).
    """
    return {"status": "alive", "timestamp": time.time()}


@app.get("/readiness")
async def readiness():
    """
    Kubernetes readiness probe endpoint.
    Returns 200 only if all critical dependencies are available.
    """
    ready = True
    details = {}

    # Check Neo4j (critical)
    try:
        with neo_kg.driver.session() as session:
            result = session.run("RETURN 1 AS test")
            result.single()
        details["neo4j"] = "ready"
    except Exception as e:
        details["neo4j"] = f"not ready: {str(e)[:100]}"
        ready = False

    # Check Redis (critical)
    try:
        memory_manager.client.ping()
        details["redis"] = "ready"
    except Exception as e:
        details["redis"] = f"not ready: {str(e)[:100]}"
        ready = False

    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")

    if not qdrant_url:
        details["qdrant"] = "not ready: QDRANT_URL not set"
        ready = False
    else:
        try:
            headers = {"api-key": qdrant_api_key} if qdrant_api_key else {}
            resp = requests.get(f"{qdrant_url}/healthz", headers=headers, timeout=2)
            if resp.status_code == 200:
                details["qdrant"] = "ready"
            else:
                details["qdrant"] = f"not ready: status {resp.status_code}"
                ready = False
        except Exception as e:
            details["qdrant"] = f"not ready: {str(e)[:100]}"
            ready = False
    # Circuit breaker states
    try:
        from app.circuit_breaker import neo4j_circuit, redis_circuit, llm_circuit, qdrant_circuit
        details["circuit_breakers"] = {
            "neo4j": neo4j_circuit.state.value,
            "redis": redis_circuit.state.value,
            "llm": llm_circuit.state.value,
            "qdrant": qdrant_circuit.state.value,
        }
    except Exception:
        pass

    if ready:
        return {"status": "ready", "details": details}
    else:
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "details": details}
        )


@app.get("/metrics")
async def metrics():
    """
    Prometheus scrape endpoint.
    Prometheus will call this instead of getting 404.
    """
    # Update circuit breaker state gauges
    try:
        from app.circuit_breaker import neo4j_circuit, redis_circuit, llm_circuit, qdrant_circuit, CircuitState

        state_map = {CircuitState.CLOSED: 0, CircuitState.OPEN: 1, CircuitState.HALF_OPEN: 2}
        CIRCUIT_BREAKER_STATE.labels(service="neo4j").set(state_map.get(neo4j_circuit.state, 0))
        CIRCUIT_BREAKER_STATE.labels(service="redis").set(state_map.get(redis_circuit.state, 0))
        CIRCUIT_BREAKER_STATE.labels(service="llm").set(state_map.get(llm_circuit.state, 0))
        CIRCUIT_BREAKER_STATE.labels(service="qdrant").set(state_map.get(qdrant_circuit.state, 0))
    except Exception:
        pass

    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


@app.get("/circuit-breakers")
async def circuit_breakers():
    """
    Get status of all circuit breakers.
    Useful for monitoring and debugging.
    """
    try:
        from app.circuit_breaker import neo4j_circuit, redis_circuit, llm_circuit, qdrant_circuit

        return {
            "neo4j": neo4j_circuit.get_stats(),
            "redis": redis_circuit.get_stats(),
            "llm": llm_circuit.get_stats(),
            "qdrant": qdrant_circuit.get_stats(),
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "circuit_breakers_unavailable", "message": str(e)}
        )

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
async def summary_endpoint(request: Request, body: SummaryRequest):
    """Generate lesson summary with validation and error handling."""
    session_id = get_session_id(request)

    try:
        logger.info("summary_request", session_id=session_id, module=body.module)
        user_in = f"ملخص محور {body.module}"
        result = generate_summary_json(user_in, neo_kg)
        memory_manager.log_event(session_id, "chapter_summary", result["data"])
        logger.info("summary_success", session_id=session_id, module=body.module)
        return JSONResponse(result)

    except TopicNotFoundError as e:
        # Already logged in exception handler
        raise
    except Exception as e:
        logger.error("summary_unexpected_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_failure", "message": str(e)}
        )


@app.post(
    "/qa",
    summary="Ask Question",
    description="Answers a student question based on the curriculum knowledge base.",
    tags=["AI Content"],
)
@limiter.limit("10/minute")
async def qa_endpoint(request: Request, body: QARequest):
    """Answer questions with validation and error handling."""
    session_id = get_session_id(request)

    try:
        logger.info("qa_request", session_id=session_id, question_length=len(body.question))
        qa_memory = memory_manager.get_session_memory(session_id)
        answer_text = handle_qa(body.question, neo_kg, qa_memory)

        memory_manager.log_event(
            session_id,
            "qa_interaction",
            {"q": body.question, "a": answer_text},
        )

        logger.info("qa_success", session_id=session_id)
        return JSONResponse({"answer": answer_text})

    except ResourceExhausted:
        # Handled by global exception handler
        raise
    except Exception as e:
        logger.error("qa_unexpected_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_failure", "message": str(e)}
        )



@app.post(
    "/quiz",
    summary="Generate Quiz",
    description="Creates a quiz with multiple choice and true/false questions.",
    tags=["AI Content"],
)
@limiter.limit("5/minute")
async def quiz_endpoint(request: Request, body: QuizRequest):
    """Generate quiz with validation and error handling."""
    session_id = get_session_id(request)

    try:
        logger.info(
            "quiz_request",
            session_id=session_id,
            module=body.module,
            num_mc=body.num_mc,
            num_tf=body.num_tf
        )

        result = generate_quiz_json(
            body.module,
            neo_kg,
            num_mc=body.num_mc,
            num_tf=body.num_tf,
        )

        memory_manager.log_event(
            session_id,
            "quiz_log",
            result["data"]["questions"],
        )

        logger.info("quiz_success", session_id=session_id, module=body.module)
        return JSONResponse(result)

    except TopicNotFoundError:
        # Handled by global exception handler
        raise
    except Exception as e:
        logger.error("quiz_unexpected_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_failure", "message": str(e)}
        )


@app.post(
    "/plan",
    summary="Generate Learning Plan",
    description="Creates a personalized learning plan based on goals and available time.",
    tags=["AI Content"],
)
@limiter.limit("3/minute")
async def plan_endpoint(request: Request, body: PlanRequest):
    """Generate learning plan with validation and error handling."""
    session_id = get_session_id(request)
    start_time = time.time()
    status = "success"

    try:
        logger.info(
            "plan_request",
            session_id=session_id,
            goal=body.goal[:50],
            time_available=body.time_available
        )

        # Create planner crew instance
        planner_crew = PlannerCrew()

        # Build inputs for the crew
        inputs = {
            "goal": body.goal,
            "time_available": body.time_available,
            "branch": body.branch or "عام",
            "topic": body.topic or "غير محدد",
            "session_id": session_id,
        }

        # Execute the planner crew
        result = planner_crew.crew().kickoff(inputs=inputs)

        # Extract the plan from the result
        plan_text = result.raw if hasattr(result, 'raw') else str(result)

        # Store plan in session data
        memory_manager.log_event(session_id, "learning_plan", plan_text)

        logger.info("plan_success", session_id=session_id)
        return JSONResponse({
            "plan": plan_text,
            "session_id": session_id,
            "inputs": inputs
        })

    except Exception as e:
        status = "error"
        logger.error("plan_unexpected_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_failure", "message": str(e)}
        )
    finally:
        duration = time.time() - start_time
        PLAN_GENERATION_DURATION.labels(status=status).observe(duration)


@app.post(
    "/tts",
    summary="Text to Speech",
    description="Generates speech audio (mp3) from text using ElevenLabs.",
    tags=["Audio"],
)
@limiter.limit("20/minute")
def tts_endpoint(request: Request, body: TTSRequest):
    session_id = get_session_id(request)

    voice_id = body.voice_id or os.getenv("ELEVENLABS_VOICE_ID", "JjTirzdD7T3GMLkwdd3a")
    model_id = body.model_id or os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")

    logger.info("tts_request", session_id=session_id, voice_id=voice_id, model_id=model_id)

    audio = synthesize_tts_bytes(
        text=body.text,
        voice_id=voice_id,
        model_id=model_id,
        stability=body.stability,
        similarity_boost=body.similarity_boost,
    )

    filename = f"tts_{uuid.uuid4().hex}.mp3"
    logger.info("tts_success", session_id=session_id, bytes=len(audio))

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )



@app.post(
    "/finish",
    summary="Finish Session",
    description="Generates a PDF report and feedback for the session.",
    tags=["Session Management"],
)
async def finish(body: FinishRequest, request: Request):
    """Finish session with validation and error handling."""
    session_id = get_session_id(request)

    try:
        logger.info("finish_request", session_id=session_id)
        session_data = memory_manager.get_session_data(session_id)

        # Validate session has data
        if not session_data:
            logger.warning("empty_session", session_id=session_id)
            raise HTTPException(
                status_code=404,
                detail={"error": "session_not_found", "message": "Session has no data or has expired"}
            )

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

        # Generate feedback
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
        session_data["quiz_score"] = body.quiz_score
        if body.student_feedback:
            session_data["student_feedback"] = body.student_feedback

        # Generate PDF
        pdf_path = Path(REPORTS_DIR) / f"session_report_{session_id}.pdf"
        render_pdf(session_data, pdf_path)

        logger.info("finish_success", session_id=session_id, pdf_path=str(pdf_path))
        return JSONResponse(
            {"pdf_url": f"/reports/session_report_{session_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("finish_unexpected_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "internal_failure", "message": str(e)}
        )