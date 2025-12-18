"""
Sentry integration for error tracking and monitoring.
Captures exceptions, performance data, and user context.
"""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
import structlog

logger = structlog.get_logger()


def init_sentry(
    dsn: str = None,
    environment: str = None,
    release: str = None,
    traces_sample_rate: float = 0.1,
    profiles_sample_rate: float = 0.1,
):
    """
    Initialize Sentry for error tracking and performance monitoring.

    Args:
        dsn: Sentry DSN (Data Source Name)
        environment: Environment name (development, staging, production)
        release: Release version (e.g., git commit hash)
        traces_sample_rate: Percentage of transactions to trace (0.0 to 1.0)
        profiles_sample_rate: Percentage of transactions to profile (0.0 to 1.0)
    """
    # Get configuration from environment if not provided
    dsn = dsn or os.getenv("SENTRY_DSN")
    environment = environment or os.getenv("ENVIRONMENT", "development")
    release = release or os.getenv("RELEASE_VERSION", "unknown")

    # Don't initialize if no DSN is provided
    if not dsn:
        logger.warning(
            "sentry_not_initialized",
            reason="SENTRY_DSN not set",
            message="Sentry error tracking disabled"
        )
        return False

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release,

            # Integrations
            integrations=[
                FastApiIntegration(
                    transaction_style="url",  # Group by URL pattern
                    failed_request_status_codes=[500, 501, 502, 503, 504, 505],
                ),
                RedisIntegration(),
            ],

            # Performance monitoring
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=profiles_sample_rate,

            # Additional options
            attach_stacktrace=True,
            send_default_pii=False,  # Don't send PII by default
            max_breadcrumbs=50,

            # Before send hook to filter/modify events
            before_send=before_send_filter,
        )

        logger.info(
            "sentry_initialized",
            environment=environment,
            release=release,
            traces_sample_rate=traces_sample_rate,
        )
        return True

    except Exception as e:
        logger.error("sentry_initialization_failed", error=str(e))
        return False


def before_send_filter(event, hint):
    """
    Filter and modify events before sending to Sentry.
    Use this to remove sensitive data or filter out noise.

    Args:
        event: Sentry event dictionary
        hint: Additional context about the event

    Returns:
        Modified event or None to drop the event
    """
    # Filter out health check errors (they're noisy)
    if 'request' in event:
        url = event['request'].get('url', '')
        if any(path in url for path in ['/health', '/liveness', '/readiness', '/metrics']):
            return None

    # Filter out expected exceptions
    if 'exception' in event:
        for exception in event['exception']['values']:
            exc_type = exception.get('type', '')

            # Don't send validation errors to Sentry (they're user errors)
            if 'ValidationError' in exc_type:
                return None

            # Don't send rate limit errors (they're expected)
            if 'RateLimitExceeded' in exc_type:
                return None

    # Add custom context
    event['tags'] = event.get('tags', {})
    event['tags']['service'] = 'ai-pipeline'

    return event


def set_user_context(session_id: str, user_id: str = None):
    """
    Set user context for Sentry events.

    Args:
        session_id: Current session ID
        user_id: Optional user ID
    """
    sentry_sdk.set_user({
        "id": user_id or session_id,
        "session_id": session_id,
    })


def set_context(name: str, context: dict):
    """
    Set custom context for Sentry events.

    Args:
        name: Context name
        context: Context data dictionary
    """
    sentry_sdk.set_context(name, context)


def capture_exception(error: Exception, **kwargs):
    """
    Manually capture an exception to Sentry.

    Args:
        error: Exception to capture
        **kwargs: Additional context (tags, extra, etc.)
    """
    with sentry_sdk.push_scope() as scope:
        # Add tags
        if 'tags' in kwargs:
            for key, value in kwargs['tags'].items():
                scope.set_tag(key, value)

        # Add extra context
        if 'extra' in kwargs:
            for key, value in kwargs['extra'].items():
                scope.set_extra(key, value)

        sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Manually capture a message to Sentry.

    Args:
        message: Message to capture
        level: Message level (debug, info, warning, error, fatal)
        **kwargs: Additional context (tags, extra, etc.)
    """
    with sentry_sdk.push_scope() as scope:
        # Add tags
        if 'tags' in kwargs:
            for key, value in kwargs['tags'].items():
                scope.set_tag(key, value)

        # Add extra context
        if 'extra' in kwargs:
            for key, value in kwargs['extra'].items():
                scope.set_extra(key, value)

        sentry_sdk.capture_message(message, level=level)


def add_breadcrumb(message: str, category: str = "default", level: str = "info", data: dict = None):
    """
    Add a breadcrumb to track user actions.

    Args:
        message: Breadcrumb message
        category: Category (e.g., 'query', 'navigation', 'ui')
        level: Level (debug, info, warning, error)
        data: Additional data dictionary
    """
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {},
    )

