from __future__ import annotations
import json
import re
import structlog
from crewai import Crew
from app.pdf_report import render_pdf
from app.helpers import embed
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

def generate_summary_json(user_in: str, kg: Neo4jKG) -> dict:
    """
    Generate lesson summary with robust error handling.

    Args:
        user_in: User input containing topic name
        kg: Knowledge graph instance

    Returns:
        Dictionary with path and data

    Raises:
        TopicNotFoundError: If topic not found in KG
        InvalidResponseError: If LLM returns invalid JSON
    """
    try:
        # Parse topic from input
        m = re.match(r"ملخص\s+(?:محور\s+)?(?P<topic>[\u0600-\u06FF ]+)", user_in)
        if not m:
            raise TopicNotFoundError(
                f"Could not parse topic from input: {user_in}",
                details={"input": user_in}
            )

        topic = m.group("topic").strip()
        logger.info("generating_summary", topic=topic)

        # Fetch data from KG
        branch = kg.find_branch_for_topic(topic)
        lessons_info = kg.get_lessons_for_topic(topic)

        # Validate results
        if not branch or not lessons_info:
            raise TopicNotFoundError(
                f"Topic '{topic}' not found in knowledge graph",
                details={"topic": topic, "branch": branch, "lessons_count": len(lessons_info)}
            )

        images_section = kg.extract_images(topic)
        sub_lessons_md = "\n".join(f"• {ld['title']}" for ld in lessons_info)

        # Generate summary
        task = summary_task(sub_lessons_md, images_section, topic, branch, summary_agent=SUMMARY_AGENT)
        raw = Crew(agents=[SUMMARY_AGENT], tasks=[task], verbose=False).kickoff().raw

        # Parse and validate JSON
        cleaned = _clean_json_block(raw)
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start == -1 or end == -1:
            raise InvalidResponseError(
                "LLM response does not contain valid JSON",
                details={"response_snippet": cleaned[:200]}
            )

        data = json.loads(cleaned[start:end+1])

        # Save to file
        filename = f"{branch}_{topic}.json".replace(" ", "_")
        out_dir = Path("lessons")
        out_dir.mkdir(exist_ok=True)
        path = out_dir / filename
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        logger.info("summary_generated", topic=topic, filename=filename)
        return {"path": f"/lessons/{filename}", "data": data}

    except (TopicNotFoundError, InvalidResponseError):
        raise  # Re-raise domain exceptions
    except json.JSONDecodeError as e:
        topic_name = topic if 'topic' in locals() else 'unknown'
        logger.error("summary_json_parse_failed", error=str(e), topic=topic_name)
        raise InvalidResponseError(
            "Failed to parse LLM response as JSON",
            details={"error": str(e)}
        )
    except Exception as e:
        topic_name = topic if 'topic' in locals() else 'unknown'
        logger.error("summary_generation_failed", error=str(e), topic=topic_name)
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

def get_parent_choices():
    return {
    "Branch": "أحياء", 
    "Topic": "التنفس",  
    "date_range": "2025-09-04 to 2025-09-18",
    "sessions_per_week": 3,
    "obstacles": [
        "يختلط عليه التفريق بين الشهيق والزفير",
        "فقدان التركيز بعد 15 دقيقة",
        "صعوبة ربط المفهوم بمواقف حياتية"
    ],
    "last_session": "في الجلسة الأخيرة، تعرف الطفل على الشهيق والزفير لكن فقد تركيزه بسرعة.",
    "parent_remark": "يملّ الطفل بسرعة إلا إذا كان النشاط تفاعليًا أو فيه أمثلة من الواقع"
}

def get_sessions_logs() -> list[dict]:
    return [
        {
            "session_id": "session_001",
            "date": "2025-08-20",
            "branch": "علوم",
            "topic": "الجهاز التنفسي",
            "lesson": "الشهيق والزفير",
            "summary": "تعرف الطفل على مفهوم الشهيق والزفير من خلال نشاط عملي وتجربة نفخ بالون.",
            "steps": [
                "طرح سؤال تمهيدي: ماذا يحدث عندما نركض؟",
                "نشاط عملي: وضع اليد على الصدر لتتبع التنفس",
                "لعبة البالون لمحاكاة الرئتين"
            ],
            "feedback": "الطفل كان متفاعلًا في البداية، لكن فقد تركيزه بعد 15 دقيقة. واجه صعوبة في ربط النشاط بالمفهوم العلمي.",
            "quiz_rating": 2,
        },
        {
            "session_id": "session_002",
            "date": "2025-08-27",
            "branch": "علوم",
            "topic": "الجهاز التنفسي",
            "lesson": "الشهيق والزفير",
            "summary": "مراجعة للمفاهيم السابقة مع تطبيق في الحياة اليومية.",
            "steps": [
                "سؤال الطفل عن مواقف حياتية تتطلب التنفس السريع",
                "تمرين تنفس عميق مع عدّ",
                "رسم توضيحي للرئتين مع أسهم"
            ],
            "feedback": "تحسن ملحوظ في الفهم. الطفل استطاع أن يشرح الفرق بين الشهيق والزفير باستخدام المثال المنزلي.",
            "quiz_rating": 8,
        }
    ]
def get_user_logs() -> list[dict]:
    return [
        {
            "user_id": "user_123",
            "name": "أحمد",
            "grade": 5,
            "strengths": [
                "فضولي ويحب الاستكشاف",
                "يستمتع بالأنشطة العملية"
            ],
            "weaknesses": [
                "يفقد التركيز بسرعة",
                "يحتاج إلى أمثلة من الحياة اليومية لفهم المفاهيم"
            ]
        }
    ]
