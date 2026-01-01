from typing import ClassVar, Optional
from pathlib import Path
from crewai import Agent, Crew, Task, LLM, Process
from crewai.project import CrewBase, agent, crew, task, llm, tool
from crewai.knowledge.source.string_knowledge_source import StringKnowledgeSource
from app.crew.tools import LessonRetrieverTool
from app.crew.knowledge_graph import Neo4jKG
from app.crew.config import embedder_cfg
import json
from app.crew.config import URI, USER, PASSWORD
from app.crew.config import settings



@CrewBase
class PlannerCrew: 
    base_directory: ClassVar[Path] = Path(__file__).parent
    agents_config: ClassVar[str] = 'config/agents.yaml'
    tasks_config:  ClassVar[str] = 'config/tasks.yaml'
    
    def __init__(self, session_logs: Optional[list] = None, user_logs: Optional[list] = None, request_data: Optional[dict] = None):
        """
        Initialize PlannerCrew with data passed directly from Spring Boot.

        Args:
            session_logs: User's session history (passed from Spring Boot)
            user_logs: User profile and learning data (passed from Spring Boot)
            request_data: Dictionary containing request parameters (branch, topic, goal, etc.)
        """
        super().__init__()
        self.session_logs = session_logs or []
        self.user_logs = user_logs or []
        self.request_data = request_data or {}

    @llm
    def llm_cfg(self) -> LLM:
        return LLM(model=settings.LLM_MODEL, base_url="https://openrouter.ai/api/v1",
                       api_key=settings.LLM_API_KEY)

    @tool
    def lesson_retriever_tool(self) -> LessonRetrieverTool:
        kg = Neo4jKG(URI, USER, PASSWORD)
        return LessonRetrieverTool(kg=kg)

    @agent
    def sessions_history_agent(self) -> Agent:
        # Use session logs passed directly from Spring Boot
        json_str = json.dumps(self.session_logs, ensure_ascii=False, indent=2)
        knowledge_source = StringKnowledgeSource(content=json_str)
        return Agent(
            config=self.agents_config['sessions_history_agent'],
            knowledge_sources=[knowledge_source],
            embedder=embedder_cfg,
        )

    @agent
    def user_history_agent(self) -> Agent:
        # Use user logs passed directly from Spring Boot
        json_str = json.dumps(self.user_logs, ensure_ascii=False, indent=2)
        knowledge_source = StringKnowledgeSource(content=json_str)
        return Agent(
            config=self.agents_config['user_history_agent'],
            knowledge_sources=[knowledge_source],
            embedder=embedder_cfg,
        )

    @agent
    def planner_agent(self) -> Agent:
        return Agent(config=self.agents_config['planner_agent'])

    @task
    def user_history_task(self) -> Task:
        return Task(
            config=self.tasks_config['user_history_task'],
            agent=self.user_history_agent(),
        )

    @task
    def sessions_history_task(self) -> Task:
        return Task(
            config=self.tasks_config['sessions_history_task'],
            agent=self.sessions_history_agent(),
        )

    @task
    def plan_task(self) -> Task:
        return Task(
            config=self.tasks_config['plan_task'],
            agent=self.planner_agent(),
            process=Process.sequential
        )

    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks, verbose=True)
