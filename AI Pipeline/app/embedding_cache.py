"""
Embedding cache implementation using Redis.
Reduces LLM API calls and improves performance.
"""
import hashlib
import json
from typing import List, Optional
import structlog
from app.memory_manager import RedisMemoryManager

logger = structlog.get_logger()


class EmbeddingCache:
    """
    Cache for text embeddings using Redis.

    Stores embeddings with TTL to reduce API calls.
    Uses MD5 hash of text as cache key.
    """

    def __init__(self, redis_manager: RedisMemoryManager, ttl: int = 86400 * 7):
        """
        Initialize embedding cache.

        Args:
            redis_manager: Redis connection manager
            ttl: Time-to-live in seconds (default 7 days)
        """
        self.redis = redis_manager.client
        self.ttl = ttl
        self.cache_prefix = "embedding_cache:"

        logger.info("embedding_cache_initialized", ttl_days=ttl // 86400)

    def _get_cache_key(self, text: str, model: str) -> str:
        """
        Generate cache key from text and model.

        Args:
            text: Input text
            model: Model name

        Returns:
            Cache key string
        """
        # Create hash of text + model for cache key
        content = f"{model}:{text}"
        hash_obj = hashlib.md5(content.encode('utf-8'))
        return f"{self.cache_prefix}{hash_obj.hexdigest()}"

    def get(self, text: str, model: str) -> Optional[List[float]]:
        """
        Get cached embedding if available.

        Args:
            text: Input text
            model: Model name

        Returns:
            List of floats if cached, None if not found
        """
        try:
            cache_key = self._get_cache_key(text, model)
            cached = self.redis.get(cache_key)

            if cached:
                embedding = json.loads(cached)
                logger.debug(
                    "embedding_cache_hit",
                    model=model,
                    text_length=len(text),
                    embedding_dim=len(embedding),
                )
                return embedding

            logger.debug("embedding_cache_miss", model=model, text_length=len(text))
            return None

        except Exception as e:
            logger.warning("embedding_cache_get_failed", error=str(e))
            # Don't fail on cache errors, just return None
            return None

    def set(self, text: str, model: str, embedding: List[float]) -> bool:
        """
        Store embedding in cache.

        Args:
            text: Input text
            model: Model name
            embedding: Embedding vector

        Returns:
            True if stored successfully, False otherwise
        """
        try:
            cache_key = self._get_cache_key(text, model)
            cached_value = json.dumps(embedding)

            self.redis.setex(cache_key, self.ttl, cached_value)

            logger.debug(
                "embedding_cached",
                model=model,
                text_length=len(text),
                embedding_dim=len(embedding),
                ttl=self.ttl,
            )
            return True

        except Exception as e:
            logger.warning("embedding_cache_set_failed", error=str(e))
            # Don't fail on cache errors
            return False

    def delete(self, text: str, model: str) -> bool:
        """
        Delete cached embedding.

        Args:
            text: Input text
            model: Model name

        Returns:
            True if deleted, False otherwise
        """
        try:
            cache_key = self._get_cache_key(text, model)
            result = self.redis.delete(cache_key)

            if result:
                logger.debug("embedding_cache_deleted", model=model, text_length=len(text))

            return bool(result)

        except Exception as e:
            logger.warning("embedding_cache_delete_failed", error=str(e))
            return False

    def clear_all(self) -> int:
        """
        Clear all cached embeddings.

        Returns:
            Number of keys deleted
        """
        try:
            pattern = f"{self.cache_prefix}*"
            keys = self.redis.keys(pattern)

            if keys:
                deleted = self.redis.delete(*keys)
                logger.info("embedding_cache_cleared", count=deleted)
                return deleted

            return 0

        except Exception as e:
            logger.error("embedding_cache_clear_failed", error=str(e))
            return 0

    def get_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache stats
        """
        try:
            pattern = f"{self.cache_prefix}*"
            keys = self.redis.keys(pattern)

            total_size = 0
            for key in keys[:100]:  # Sample first 100 to avoid overhead
                try:
                    size = self.redis.memory_usage(key)
                    if size:
                        total_size += size
                except:
                    pass

            return {
                "total_keys": len(keys),
                "estimated_size_bytes": total_size * (len(keys) / min(100, len(keys))) if keys else 0,
                "ttl_seconds": self.ttl,
            }

        except Exception as e:
            logger.warning("embedding_cache_stats_failed", error=str(e))
            return {
                "total_keys": 0,
                "estimated_size_bytes": 0,
                "ttl_seconds": self.ttl,
            }

