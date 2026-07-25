from enum import Enum
from app.core.config import settings


class LlmPurpose(str, Enum):
    SCORING = "scoring"
    TAILORING = "tailoring"
    EXTRACT = "extract"


_PURPOSE_MODEL_KEYS: dict[LlmPurpose, str | None] = {
    LlmPurpose.SCORING: settings.MODEL_SCORER,
    LlmPurpose.TAILORING: settings.MODEL_TAILOR,
    LlmPurpose.EXTRACT: None,
}


def resolve_model(purpose: LlmPurpose) -> str:
    override = _PURPOSE_MODEL_KEYS.get(purpose)
    if override:
        return override
    return settings.LLM_MODEL


def resolve_fallback_chain(purpose: LlmPurpose) -> list[str]:
    model = resolve_model(purpose)
    models = [model]
    extras = [m.strip() for m in settings.LLM_FALLBACK_MODELS.split(",") if m.strip()]
    models.extend(m for m in extras if m not in models)
    return models
