"""
Circuit breaker implementation for external service protection.
Prevents cascading failures when services are degraded or down.
"""
import time
import threading
from enum import Enum
from typing import Callable, Any
import structlog

logger = structlog.get_logger()


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Circuit tripped, rejecting requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.

    Prevents cascading failures by stopping requests to failing services.
    After a timeout, allows test requests to check if service recovered.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
    ):
        """
        Initialize circuit breaker.

        Args:
            name: Circuit breaker name for logging
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before trying again
            expected_exception: Exception type that triggers the circuit
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self._failure_count = 0
        self._last_failure_time = None
        self._state = CircuitState.CLOSED
        self._lock = threading.Lock()

        logger.info(
            "circuit_breaker_initialized",
            name=name,
            threshold=failure_threshold,
            timeout=recovery_timeout,
        )

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        with self._lock:
            return self._state

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to call
            *args, **kwargs: Arguments to pass to function

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit is open
            Original exception: If function fails
        """
        with self._lock:
            if self._state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self._should_attempt_reset():
                    logger.info("circuit_breaker_half_open", name=self.name)
                    self._state = CircuitState.HALF_OPEN
                else:
                    logger.warning(
                        "circuit_breaker_open_rejecting_request",
                        name=self.name,
                        failures=self._failure_count,
                    )
                    raise CircuitBreakerOpen(
                        f"Circuit breaker '{self.name}' is OPEN",
                        details={
                            "name": self.name,
                            "failure_count": self._failure_count,
                            "last_failure": self._last_failure_time,
                        }
                    )

        try:
            # Execute the function
            result = func(*args, **kwargs)

            # Success - reset if needed
            with self._lock:
                if self._state == CircuitState.HALF_OPEN:
                    logger.info("circuit_breaker_closed", name=self.name)
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0

            return result

        except self.expected_exception as e:
            # Record failure
            with self._lock:
                self._failure_count += 1
                self._last_failure_time = time.time()

                if self._failure_count >= self.failure_threshold:
                    logger.error(
                        "circuit_breaker_opened",
                        name=self.name,
                        failures=self._failure_count,
                        threshold=self.failure_threshold,
                    )
                    self._state = CircuitState.OPEN
                else:
                    logger.warning(
                        "circuit_breaker_failure_recorded",
                        name=self.name,
                        failures=self._failure_count,
                        threshold=self.failure_threshold,
                    )

            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if self._last_failure_time is None:
            return True

        elapsed = time.time() - self._last_failure_time
        return elapsed >= self.recovery_timeout

    def reset(self):
        """Manually reset the circuit breaker."""
        with self._lock:
            self._failure_count = 0
            self._last_failure_time = None
            self._state = CircuitState.CLOSED
            logger.info("circuit_breaker_reset", name=self.name)

    def get_stats(self) -> dict:
        """Get circuit breaker statistics."""
        with self._lock:
            return {
                "name": self.name,
                "state": self._state.value,
                "failure_count": self._failure_count,
                "failure_threshold": self.failure_threshold,
                "last_failure_time": self._last_failure_time,
                "recovery_timeout": self.recovery_timeout,
            }


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open and rejecting requests."""

    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


# Global circuit breakers for different services
neo4j_circuit = CircuitBreaker(
    name="neo4j",
    failure_threshold=5,
    recovery_timeout=30,
    expected_exception=Exception,
)

redis_circuit = CircuitBreaker(
    name="redis",
    failure_threshold=5,
    recovery_timeout=30,
    expected_exception=Exception,
)

llm_circuit = CircuitBreaker(
    name="llm",
    failure_threshold=3,
    recovery_timeout=60,
    expected_exception=Exception,
)

qdrant_circuit = CircuitBreaker(
    name="qdrant",
    failure_threshold=5,
    recovery_timeout=30,
    expected_exception=Exception,
)

tts_circuit = CircuitBreaker(
    name="tts",
    failure_threshold=5,
    recovery_timeout=30,
    expected_exception=Exception,
)


