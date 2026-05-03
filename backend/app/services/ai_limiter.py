import asyncio
import time
from typing import Optional
from app.core.logging import logger

class AILimiter:
    """
    Singleton to manage AI request concurrency and cooldowns.
    Ensures only one request is processed at a time and enforces a global delay.
    """
    _instance: Optional['AILimiter'] = None
    _lock = asyncio.Lock()
    _last_request_time = 0.0
    _cooldown_seconds = 5.0  # 5 seconds delay between any AI calls

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AILimiter, cls).__new__(cls)
        return cls._instance

    async def acquire(self):
        """
        Acquires the lock and waits for the cooldown if necessary.
        """
        await self._lock.acquire()
        
        elapsed = time.time() - self._last_request_time
        if elapsed < self._cooldown_seconds:
            wait_time = self._cooldown_seconds - elapsed
            logger.info(f"AI Cooldown active. Waiting {wait_time:.2f}s...")
            await asyncio.sleep(wait_time)
        
        self._last_request_time = time.time()

    def release(self):
        """
        Releases the lock.
        """
        self._last_request_time = time.time()
        self._lock.release()

ai_limiter = AILimiter()
