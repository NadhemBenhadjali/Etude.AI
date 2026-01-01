from crewai import Agent, LLM

from app.crew.config import settings

def build_llm() -> LLM:
    return LLM(model=settings.LLM_MODEL, base_url="https://openrouter.ai/api/v1",
    api_key=settings.LLM_API_KEY, reasoning_effort="low")

def define_agents(tool) -> tuple[Agent, Agent, Agent, Agent]:
    llm = build_llm()
    summary = Agent(
        role="ملخّص الدرس",
        goal="ملخّص ساهل بالدارجة",
        backstory="معلّمة توضّح الدروس.",
        llm=llm,
        tools=[tool],
        verbose=True,
    )
    qa = Agent(
        role="معلّم يجاوب",
        goal="يشرح بصبر ويتأكّد من الفهم ويستشهد بالصفحات",
        backstory="معلّم صبور.",
        llm=llm,
        tools=[tool],
        verbose=True,
    )
    quiz = Agent(
        role="صانع الامتحانات",
        goal="يعمل أسئلة بسيطة ويصحّحها بناءً على المحور المحدّد",
        backstory="يحب النجوم الذهبية.",
        llm=llm,
        tools=[tool],
        verbose=True,
    )
    feedback = Agent(
        role="معدّ التقرير",
        goal="يكتب تقرير PDF مشجّع",
        backstory="أخصّائي متابعة تعلم.",
        llm=llm,
        verbose=True,
    )

    return summary, qa, quiz, feedback
