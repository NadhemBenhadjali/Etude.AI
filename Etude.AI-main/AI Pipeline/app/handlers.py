from __future__ import annotations
import json, re
from crewai import Crew
from app.pdf_report import render_pdf
from app.crew.tools import embed
from app.crew.knowledge_graph import Neo4jKG
from pathlib import Path
from app.helpers import _clean_json_block, parse_quiz_json, _clean_user_question
from app.runtime import SUMMARY_AGENT, QA_AGENT, QUIZ_AGENT
from app.crew.tasks import summary_task, qa_task, quiz_task

def generate_summary_json(user_in: str, kg: Neo4jKG) -> dict:
    m = re.match(r"ملخص\s+(?:محور\s+)?(?P<topic>[\u0600-\u06FF ]+)", user_in)
    topic = m.group("topic").strip()
    branch = kg.find_branch_for_topic(topic)
    lessons_info = kg.get_lessons_for_topic(topic)
    images_section = kg.extract_images(topic)
    sub_lessons_md = "\n".join(f"• {ld['title']}" for ld in lessons_info)
    task = summary_task(sub_lessons_md,images_section, topic, branch,summary_agent=SUMMARY_AGENT)
    raw = Crew(agents=[SUMMARY_AGENT], tasks=[task], verbose=False).kickoff().raw
    cleaned = _clean_json_block(raw)
    start = cleaned.find("{"); end = cleaned.rfind("}")
    data = json.loads(cleaned[start:end+1])
    filename = f"{branch}_{topic}.json".replace(" ", "_")
    out_dir = Path("lessons"); out_dir.mkdir(exist_ok=True)
    path = out_dir / filename
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"path": f"/lessons/{filename}", "data": data}


def handle_qa(question: str, kg,QA_MEMORY) -> str:
    q = _clean_user_question(question)
    mem_vars = QA_MEMORY.load_memory_variables({})
    history = mem_vars.get("chat_history", "")
    task = qa_task(history, question=q, qa_agent=QA_AGENT)
    answer = Crew(agents=[QA_AGENT], tasks=[task], verbose=False).kickoff().raw
    QA_MEMORY.save_context({"user_input": q}, {"assistant_output": answer})
    return answer

def generate_quiz_json(module: str, kg, num_mc: int=6, num_tf: int=4) -> dict:
    branch = kg.find_branch_for_topic(module)
    lessons_info = kg.get_lessons_for_topic(module)
    if not branch or not lessons_info:
        raise LookupError(f"⚠️ ما لقيتش المحور «{module}» في الـ KG.")
    sub_list = "\n".join(f"• {ld['title']} (pages {ld['start_page']}–{ld['end_page']})" for ld in lessons_info)
    task = quiz_task(module, branch, sub_list, num_mc, num_tf, quiz_agent=QUIZ_AGENT)
    raw = Crew(agents=[QUIZ_AGENT], tasks=[task], verbose=False).kickoff().raw
    data = parse_quiz_json(raw)
    return {"module": module, "data": data}
