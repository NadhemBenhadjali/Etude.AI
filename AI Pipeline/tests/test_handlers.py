import sys
from unittest.mock import MagicMock, patch

# Mock modules that might be missing or require heavy init
sys.modules["crewai_tools"] = MagicMock()
sys.modules["app.runtime"] = MagicMock()
sys.modules["app.runtime"].SUMMARY_AGENT = MagicMock()
sys.modules["app.runtime"].QA_AGENT = MagicMock()
sys.modules["app.runtime"].QUIZ_AGENT = MagicMock()

import pytest
import json
from app.handlers import generate_summary_json, handle_qa

@pytest.fixture
def mock_kg():
    kg = MagicMock()
    # Mock return values for KG methods
    kg.find_branch_for_topic.return_value = "Science"
    kg.get_lessons_for_topic.return_value = [{"title": "Lesson 1", "start_page": 1, "end_page": 2}]
    kg.extract_images.return_value = "Image markdown"
    return kg

@pytest.fixture
def mock_memory():
    mem = MagicMock()
    # Mock load_memory_variables to return some history
    mem.load_memory_variables.return_value = {"chat_history": ""}
    return mem

@patch("app.handlers.Crew")
def test_generate_summary_json(mock_crew_cls, mock_kg):
    # Setup mock Crew to return a raw JSON string matching the prompt schema
    mock_crew_instance = mock_crew_cls.return_value
    mock_crew_instance.kickoff.return_value.raw = json.dumps({
        "title": "Lesson on Science",
        "slides": [
            {"number": "1", "text": "Slide 1 text"}
        ]
    })

    # Validate task creation logic is mocked out to avoid Pydantic validation of Agents
    with patch("app.handlers.summary_task") as mock_summary_task:
        mock_summary_task.return_value = MagicMock()
        
        # Call the function
        result = generate_summary_json("ملخص محور Science", mock_kg)

    # Assertions
    assert "data" in result
    assert result["data"]["title"] == "Lesson on Science"
    assert len(result["data"]["slides"]) == 1
    # Verify the file path construction
    assert "lessons/" in result["path"]

@patch("app.handlers.Crew")
def test_handle_qa(mock_crew_cls, mock_kg, mock_memory):
    # Setup mock Crew to return a raw string answer
    mock_crew_instance = mock_crew_cls.return_value
    mock_crew_instance.kickoff.return_value.raw = "The answer is 42."

    with patch("app.handlers.qa_task") as mock_qa_task:
        mock_qa_task.return_value = MagicMock()
        
        # Call the function
        answer = handle_qa("What is the answer?", mock_kg, mock_memory)

    # Assertions
    assert answer == "The answer is 42."
    # Verify memory save was called
    mock_memory.save_context.assert_called_once()
