import os
import json
import redis
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory
import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.crew.config import settings
from app.exceptions import RedisConnectionError

logger = structlog.get_logger()


class RedisMemoryManager:
    def __init__(self, redis_url: str = None, ttl: int = 86400):
        """
        Initialize Redis connection with proper pooling configuration.

        Args:
            redis_url: Redis connection URL
            ttl: Time-to-live for keys in seconds (default 24 hours)
        """
        # Use settings.REDIS_URL as default
        self.redis_url = redis_url or settings.REDIS_URL
        self.ttl = ttl

        try:
            # Create connection pool for better performance
            self.client = redis.Redis.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=20,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )
            # Test connection
            self.client.ping()
            logger.info("redis_connected", url=self.redis_url)
        except Exception as e:
            logger.error("redis_connection_failed", url=self.redis_url, error=str(e))
            raise RedisConnectionError(
                "Failed to connect to Redis",
                details={"url": self.redis_url, "error": str(e)}
            )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((redis.ConnectionError, redis.TimeoutError)),
        reraise=True,
    )
    def get_session_memory(self, session_id: str) -> ConversationBufferMemory:
        """Get conversation memory for a session with retry logic."""
        try:
            message_history = RedisChatMessageHistory(
                url=self.redis_url,
                ttl=self.ttl,
                session_id=f"chat_history:{session_id}"
            )
            return ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                chat_memory=message_history
            )
        except Exception as e:
            logger.error("get_session_memory_failed", session_id=session_id, error=str(e))
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((redis.ConnectionError, redis.TimeoutError)),
        reraise=True,
    )
    def log_event(self, session_id: str, key: str, data: any):
        """Log an event to session data with retry logic."""
        try:
            redis_key = f"session_data:{session_id}"
            if isinstance(data, (dict, list)):
                data = json.dumps(data, ensure_ascii=False)
            elif not isinstance(data, str):
                data = str(data)

            self.client.hset(redis_key, key, data)
            self.client.expire(redis_key, self.ttl)
            logger.debug("event_logged", session_id=session_id, key=key)
        except Exception as e:
            logger.error("log_event_failed", session_id=session_id, key=key, error=str(e))
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((redis.ConnectionError, redis.TimeoutError)),
        reraise=True,
    )
    def get_session_data(self, session_id: str) -> dict:
        """Get all session data with retry logic."""
        try:
            redis_key = f"session_data:{session_id}"
            data = self.client.hgetall(redis_key)
            decoded_data = {}
            for k, v in data.items():
                try:
                    decoded_data[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    decoded_data[k] = v
            logger.debug("session_data_fetched", session_id=session_id, keys=list(decoded_data.keys()))
            return decoded_data
        except Exception as e:
            logger.error("get_session_data_failed", session_id=session_id, error=str(e))
            raise

    def get_chat_history(self, session_id: str):
        """Get chat history for a session."""
        try:
            history = RedisChatMessageHistory(
                url=self.redis_url,
                session_id=f"chat_history:{session_id}"
            )
            return [(msg.content, "") if msg.type == 'human' else ("", msg.content) for msg in history.messages]
        except Exception as e:
            logger.error("get_chat_history_failed", session_id=session_id, error=str(e))
            return []  # Return empty list on failure instead of crashing
