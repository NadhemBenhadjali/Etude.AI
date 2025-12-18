"""
Custom exception hierarchy for domain-specific error handling.
Provides context-rich errors for better observability and debugging.
"""


class EtudeAIException(Exception):
    """Base exception for all Etude.AI errors."""

    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ServiceUnavailableError(EtudeAIException):
    """Raised when an external service (Neo4j, Redis, Qdrant, LLM) is unavailable."""
    pass


class Neo4jConnectionError(ServiceUnavailableError):
    """Neo4j connection or query failure."""
    pass


class RedisConnectionError(ServiceUnavailableError):
    """Redis connection failure."""
    pass


class QdrantConnectionError(ServiceUnavailableError):
    """Qdrant connection or search failure."""
    pass


class LLMServiceError(EtudeAIException):
    """LLM service errors (rate limits, quota exhaustion, API errors)."""
    pass


class LLMQuotaExhaustedError(LLMServiceError):
    """LLM quota/rate limit exceeded."""
    pass


class LLMTimeoutError(LLMServiceError):
    """LLM request timed out."""
    pass


class ValidationError(EtudeAIException):
    """Input validation errors."""
    pass


class TopicNotFoundError(EtudeAIException):
    """Requested topic not found in knowledge graph."""
    pass


class LessonNotFoundError(EtudeAIException):
    """Requested lesson not found in knowledge graph."""
    pass


class SessionNotFoundError(EtudeAIException):
    """Session ID not found or expired."""
    pass


class InvalidResponseError(EtudeAIException):
    """LLM returned malformed or unparseable response."""
    pass


class PDFGenerationError(EtudeAIException):
    """PDF report generation failed."""
    pass


class EmbeddingError(LLMServiceError):
    """Embedding generation failed."""
    pass

