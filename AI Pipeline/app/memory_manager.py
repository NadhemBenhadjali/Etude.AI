import os
import json
import redis
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from app.crew.config import settings


class RedisMemoryManager:
    def __init__(self, redis_url: str = None, ttl: int = 86400):
        # Use settings.REDIS_URL as default
        self.redis_url = redis_url or settings.REDIS_URL
        self.ttl = ttl
        self.client = redis.Redis.from_url(self.redis_url, decode_responses=True)

    def get_session_memory(self, session_id: str) -> ConversationBufferMemory:
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

    def log_event(self, session_id: str, key: str, data: any):
        redis_key = f"session_data:{session_id}"
        if isinstance(data, (dict, list)):
            data = json.dumps(data, ensure_ascii=False)
        elif not isinstance(data, str):
            data = str(data)

        self.client.hset(redis_key, key, data)
        self.client.expire(redis_key, self.ttl)

    def get_session_data(self, session_id: str) -> dict:
        redis_key = f"session_data:{session_id}"
        data = self.client.hgetall(redis_key)
        decoded_data = {}
        for k, v in data.items():
            try:
                decoded_data[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                decoded_data[k] = v
        return decoded_data

    def get_chat_history(self, session_id: str):
        history = RedisChatMessageHistory(
            url=self.redis_url,
            session_id=f"chat_history:{session_id}"
        )
        return [(msg.content, "") if msg.type == 'human' else ("", msg.content) for msg in history.messages]