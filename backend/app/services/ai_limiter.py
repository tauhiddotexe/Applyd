import asyncio
import time
from collections import defaultdict
from typing import Optional
from app.core.logging import logger

class AILimiter:
    """
    Per-user AI request limiter to prevent cross-user DoS.
    Each user has their own cooldown, but max 3 concurrent requests globally.
    """
    _instance: Optional['AILimiter'] = None
    _global_semaphore = asyncio.Semaphore(3)
    _last_request_time: dict = defaultdict(float)
    _cooldown_seconds = 5.0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AILimiter, cls).__new__(cls)
        return cls._instance

    async def acquire(self):
        await self._global_semaphore.acquire()
        
        elapsed = time.time() - self._last_request_time["_last"]
        if elapsed < self._cooldown_seconds:
            wait_time = self._cooldown_seconds - elapsed
            logger.info(f"AI Cooldown active. Waiting {wait_time:.2f}s...")
            await asyncio.sleep(wait_time)
        
        self._last_request_time["_last"] = time.time()

    def release(self):
        self._last_request_time["_last"] = time.time()
        self._global_semaphore.release()

ai_limiter = AILimiter()
