import logging
import sys
from app.core.config import settings


import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if they exist
        if hasattr(record, "extra_info"):
            log_data.update(record.extra_info)
            
        return json.dumps(log_data)

def setup_logging() -> logging.Logger:
    logger = logging.getLogger("applyd")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    return logger


logger = setup_logging()
