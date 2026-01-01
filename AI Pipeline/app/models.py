"""
Pydantic models for request validation and sanitization.
Ensures all inputs are validated before processing.
"""
from pydantic import BaseModel, Field, field_validator
import re


class SummaryRequest(BaseModel):
    """Request model for /summary endpoint."""

    module: str = Field(..., min_length=1, max_length=200, description="Module/topic name in Arabic")

    @field_validator('module')
    @classmethod
    def validate_module(cls, v: str) -> str:
        """Validate and sanitize module name."""
        v = v.strip()
        if not v:
            raise ValueError("Module name cannot be empty")

        # Remove control characters and excessive whitespace
        v = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', v)
        v = re.sub(r'\s+', ' ', v)

        # Ensure it contains Arabic characters
        if not re.search(r'[\u0600-\u06FF]', v):
            raise ValueError("Module name must contain Arabic characters")

        return v


class QARequest(BaseModel):
    """Request model for /qa endpoint."""

    question: str = Field(..., min_length=1, max_length=1000, description="Student question in Arabic")

    @field_validator('question')
    @classmethod
    def validate_question(cls, v: str) -> str:
        """Validate and sanitize question."""
        v = v.strip()
        if not v:
            raise ValueError("Question cannot be empty")

        # Remove control characters
        v = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', v)
        v = re.sub(r'\s+', ' ', v)

        if len(v) < 3:
            raise ValueError("Question is too short")

        return v


class QuizRequest(BaseModel):
    """Request model for /quiz endpoint."""

    module: str = Field(..., min_length=1, max_length=200, description="Module/topic name in Arabic")
    num_mc: int = Field(default=6, ge=1, le=20, description="Number of multiple choice questions")
    num_tf: int = Field(default=4, ge=1, le=20, description="Number of true/false questions")

    @field_validator('module')
    @classmethod
    def validate_module(cls, v: str) -> str:
        """Validate and sanitize module name."""
        v = v.strip()
        if not v:
            raise ValueError("Module name cannot be empty")

        # Remove control characters and excessive whitespace
        v = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', v)
        v = re.sub(r'\s+', ' ', v)

        # Ensure it contains Arabic characters
        if not re.search(r'[\u0600-\u06FF]', v):
            raise ValueError("Module name must contain Arabic characters")

        return v


class PlanRequest(BaseModel):
    """Request model for /plan endpoint.

    Spring Boot collects all data (parent_choices, session_logs, user_logs)
    and sends it directly to the AI Pipeline.
    """

    goal: str = Field(..., min_length=10, max_length=500, description="Learning goal description")
    time_available: str = Field(..., description="Available time (e.g., '2 weeks', '10 days')")
    branch: str = Field(default="", max_length=100, description="Subject branch (optional)")
    topic: str = Field(default="", max_length=200, description="Specific topic (optional)")
    obstacles: list[str] = Field(default=[], description="List of learning obstacles")
    parent_remark: str = Field(default="", max_length=1000, description="Parent remarks")
    session_logs: list[dict] = Field(default=[], description="User's session history from backend")
    user_logs: list[dict] = Field(default=[], description="User profile and learning data from backend")

    @field_validator('goal', 'time_available', 'parent_remark')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Sanitize text input."""
        if not v:
            return ""
        v = v.strip()
        # Remove control characters
        v = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', v)
        v = re.sub(r'\s+', ' ', v)
        return v


class FinishRequest(BaseModel):
    """Request model for /finish endpoint."""

    quiz_score: int = Field(default=0, ge=0, le=100, description="Quiz score percentage")
    student_feedback: str = Field(default="", max_length=1000, description="Optional student feedback")

    @field_validator('student_feedback')
    @classmethod
    def sanitize_feedback(cls, v: str) -> str:
        """Sanitize feedback text."""
        if not v:
            return ""
        v = v.strip()
        # Remove control characters
        v = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', v)
        v = re.sub(r'\s+', ' ', v)
        return v

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str | None = None
    model_id: str | None = None
    stability: float = Field(0.5, ge=0.0, le=1.0)
    similarity_boost: float = Field(0.75, ge=0.0, le=1.0)

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v2 = v.strip()
        if not v2:
            raise ValueError("text cannot be empty")
        return v2