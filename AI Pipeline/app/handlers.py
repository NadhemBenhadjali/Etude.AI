from __future__ import annotations
import json
import structlog
import litellm
from crewai import Crew
from app.crew.agents import build_llm
from app.crew.knowledge_graph import Neo4jKG
from pathlib import Path
from app.helpers import _clean_json_block, parse_quiz_json, _clean_user_question, _extract_final_answer
from app.runtime import SUMMARY_AGENT, QA_AGENT, QUIZ_AGENT
from app.crew.tasks import summary_task, qa_task, quiz_task
from app.exceptions import (
    TopicNotFoundError,
    InvalidResponseError,
)

logger = structlog.get_logger()

def _normalize_summary_images(data: dict) -> dict:
    if not isinstance(data, dict) or "slides" not in data or not isinstance(data["slides"], list):
        return data
    for slide in data["slides"]:
        if not isinstance(slide, dict):
            continue
        img = slide.get("image")
        if isinstance(img, str) and img.strip():
            img = img.strip().lstrip("/")
            if not img.startswith("assets/book_images/") and not img.startswith("http://") and not img.startswith("https://"):
                if img.startswith("book_images/"):
                    img = "assets/" + img
                elif img.startswith("assets/"):
                    img = img
                else:
                    img = f"assets/book_images/{img}"
            slide["image"] = img
    return data

def generate_summary_stream(topic_input: str, kg: Neo4jKG, session_id: str | None = None, memory_manager = None):
    try:
        topic = topic_input.strip()
        logger.info("generating_summary_stream", topic=topic, session_id=session_id)

        branch = kg.find_branch_for_topic(topic)
        lessons_info = kg.get_lessons_for_topic(topic)

        if not branch or not lessons_info:
            err = {"error": "TopicNotFoundError", "message": f"Topic '{topic}' not found in knowledge graph"}
            yield f"event: error\ndata: {json.dumps(err, ensure_ascii=False)}\n\n"
            return

        yield f"event: status\ndata: {json.dumps({'status': 'generating', 'branch': branch, 'topic': topic}, ensure_ascii=False)}\n\n"

        images_section = kg.extract_images(topic)
        sub_lessons_md = "\n".join(f"• {ld['title']}" for ld in lessons_info)
        task = summary_task(sub_lessons_md, images_section, topic, branch, summary_agent=SUMMARY_AGENT)

        # Utilize centralized build_llm()
        llm = build_llm()

        response = litellm.completion(
            model=llm.model,
            messages=[
                {"role": "system", "content": "إنتي معلّمة تونسية توضّح الدروس لتلميذ في السنة الرابعة ابتدائي بالدارجة التونسية. يجب أن تكون المخرجات JSON فقط بدون أي نص إضافي."},
                {"role": "user", "content": task.description}
            ],
            api_key=llm.api_key,
            base_url=llm.base_url,
            stream=True,
        )

        full_raw = ""
        for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_raw += delta
                yield f"event: token\ndata: {json.dumps({'token': delta}, ensure_ascii=False)}\n\n"

        cleaned = _clean_json_block(full_raw)
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1:
            err = {"error": "InvalidResponseError", "message": "LLM response does not contain valid JSON"}
            yield f"event: error\ndata: {json.dumps(err, ensure_ascii=False)}\n\n"
            return

        data = json.loads(cleaned[start:end+1])
        data = _normalize_summary_images(data)
        filename = f"{branch}_{topic}.json".replace(" ", "_")
        out_dir = Path("lessons")
        out_dir.mkdir(exist_ok=True)
        (out_dir / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        if memory_manager and session_id:
            try:
                memory_manager.log_event(session_id, "chapter_summary", data)
            except Exception as e:
                logger.warning("failed_to_log_summary_to_memory", error=str(e))

        complete_data = {"path": f"/lessons/{filename}", "data": data}
        yield f"event: complete\ndata: {json.dumps(complete_data, ensure_ascii=False)}\n\n"
        logger.info("summary_stream_completed", topic=topic, filename=filename)

    except Exception as e:
        logger.error("summary_stream_failed", error=str(e), topic=topic_input)
        err = {"error": type(e).__name__, "message": str(e)}
        yield f"event: error\ndata: {json.dumps(err, ensure_ascii=False)}\n\n"

def generate_summary_json(topic_input: str, kg: Neo4jKG) -> dict:
    try:
        topic = topic_input.strip()
        logger.info("generating_summary", topic=topic)

        branch = kg.find_branch_for_topic(topic)
        lessons_info = kg.get_lessons_for_topic(topic)

        if not branch or not lessons_info:
            raise TopicNotFoundError(
                f"Topic '{topic}' not found in knowledge graph",
                details={"topic": topic, "branch": branch, "lessons_count": len(lessons_info) if lessons_info else 0}
            )

        images_section = kg.extract_images(topic)
        sub_lessons_md = "\n".join(f"• {ld['title']}" for ld in lessons_info)

        task = summary_task(sub_lessons_md, images_section, topic, branch, summary_agent=SUMMARY_AGENT)
        raw = Crew(agents=[SUMMARY_AGENT], tasks=[task], verbose=False).kickoff().raw

        cleaned = _clean_json_block(raw)
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start == -1 or end == -1:
            raise InvalidResponseError(
                "LLM response does not contain valid JSON",
                details={"response_snippet": cleaned[:200]}
            )

        data = json.loads(cleaned[start:end+1])
        data = _normalize_summary_images(data)

        filename = f"{branch}_{topic}.json".replace(" ", "_")
        out_dir = Path("lessons")
        out_dir.mkdir(exist_ok=True)
        path = out_dir / filename
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        logger.info("summary_generated", topic=topic, filename=filename)
        return {"path": f"/lessons/{filename}", "data": data}

    except (TopicNotFoundError, InvalidResponseError):
        raise
    except json.JSONDecodeError as e:
        logger.error("summary_json_parse_failed", error=str(e), topic=topic_input)
        raise InvalidResponseError(
            "Failed to parse LLM response as JSON",
            details={"error": str(e)}
        )
    except Exception as e:
        logger.error("summary_generation_failed", error=str(e), topic=topic_input)
        raise

def handle_qa(question: str, kg,QA_MEMORY) -> str:
    """
    Handle Q&A interactions with proper answer extraction.

    When the agent uses tools (ReAct framework), it outputs:
    Thought: ...
    Action: ...
    Final Answer: ...

    We need to extract only the Final Answer part.
    """
    q = _clean_user_question(question)
    mem_vars = QA_MEMORY.load_memory_variables({})
    history = mem_vars.get("chat_history", "")
    task = qa_task(history, question=q, qa_agent=QA_AGENT)
    raw_response = Crew(agents=[QA_AGENT], tasks=[task], verbose=False).kickoff().raw

    # Extract final answer if the response contains ReAct framework output
    answer = _extract_final_answer(raw_response)

    QA_MEMORY.save_context({"user_input": q}, {"assistant_output": answer})
    return answer

def generate_quiz_json(module: str, kg, num_mc: int=6, num_tf: int=4) -> dict:
    """
    Generate quiz with error handling.

    Args:
        module: Module/topic name
        kg: Knowledge graph instance
        num_mc: Number of multiple choice questions
        num_tf: Number of true/false questions

    Returns:
        Dictionary with module and quiz data

    Raises:
        TopicNotFoundError: If module not found in KG
        InvalidResponseError: If LLM returns invalid JSON
    """
    try:
        logger.info("generating_quiz", module=module, num_mc=num_mc, num_tf=num_tf)

        # Fetch module data
        branch = kg.find_branch_for_topic(module)
        lessons_info = kg.get_lessons_for_topic(module)

        # Validate results
        if not branch or not lessons_info:
            raise TopicNotFoundError(
                f"⚠️ ما لقيتش المحور «{module}» في الـ KG.",
                details={"module": module, "branch": branch, "lessons_count": len(lessons_info)}
            )

        # Generate quiz
        sub_list = "\n".join(f"• {ld['title']} (pages {ld['start_page']}–{ld['end_page']})" for ld in lessons_info)
        task = quiz_task(module, branch, sub_list, num_mc, num_tf, quiz_agent=QUIZ_AGENT)
        raw = Crew(agents=[QUIZ_AGENT], tasks=[task], verbose=False).kickoff().raw

        # Parse response
        data = parse_quiz_json(raw)

        if not data or not isinstance(data, dict):
            raise InvalidResponseError(
                "Quiz data is invalid",
                details={"module": module}
            )

        logger.info("quiz_generated", module=module, questions_count=len(data.get("questions", [])))
        return {"module": module, "data": data}

    except (TopicNotFoundError, InvalidResponseError):
        raise  # Re-raise domain exceptions
    except Exception as e:
        logger.error("quiz_generation_failed", error=str(e), module=module)
        raise

def get_parent_choices(branch: str = "", topic: str = "", time_available: str = "", goal: str = "", obstacles: list[str] = None, parent_remark: str = "") -> dict:
    """
    Build parent choices dictionary from provided parameters.
    Note: Data is passed from Spring Boot backend, not fetched here.

    Args:
        branch: Subject branch (e.g., "أحياء", "رياضيات")
        topic: Specific topic within the branch
        time_available: Available time for learning (e.g., "2 weeks", "10 days")
        goal: Learning goal description
        obstacles: List of learning obstacles/challenges
        parent_remark: Additional remarks from parent
    
    Returns:
        Dictionary containing parent choices and preferences
    """
    return {
        "Branch": branch or "غير محدد",
        "Topic": topic or "غير محدد",
        "time_available": time_available or "غير محدد",
        "goal": goal or "غير محدد",
        "obstacles": obstacles or [],
        "parent_remark": parent_remark or ""
    }

