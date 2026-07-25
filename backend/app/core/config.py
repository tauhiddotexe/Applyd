from urllib.parse import urlparse

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://applyd-mark2.vercel.app"
    FRONTEND_URL: str = "https://applyd-mark2.vercel.app"
    LOG_LEVEL: str = "INFO"
    LLM_PROVIDER: str = "opencode"
    LLM_API_KEY: str | None = None
    LLM_BASE_URL: str | None = None
    LLM_MODEL: str = "opencode/deepseek-v4-flash-free"
    LLM_FALLBACK_MODELS: str = ""
    MODEL_SCORER: str | None = None
    MODEL_TAILOR: str | None = None
    PENALIZE_MISSING_SALARY: bool = False
    MISSING_SALARY_PENALTY: int = 10

    @property
    def active_llm_base_url(self) -> str:
        if self.LLM_BASE_URL:
            return self.LLM_BASE_URL
        defaults = {
            "opencode": "https://opencode.ai/zen/v1",
            "openrouter": "https://openrouter.ai/api/v1",
            "openai": "https://api.openai.com/v1",
        }
        return defaults.get(self.LLM_PROVIDER, defaults["opencode"])

    @property
    def active_llm_api_key(self) -> str:
        if self.LLM_API_KEY:
            return self.LLM_API_KEY
        env_keys = {
            "opencode": "OPENCODE_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "openai": "OPENAI_API_KEY",
            "opencode-zen": "OPENCODE_ZEN_API_KEY",
        }
        import os
        return os.getenv(env_keys.get(self.LLM_PROVIDER, ""), "sk-no-key-required")

    @property
    def model_fallback_chain(self) -> list[str]:
        models = [self.MODEL_SCORER or self.LLM_MODEL]
        extras = [m.strip() for m in self.LLM_FALLBACK_MODELS.split(",") if m.strip()]
        models.extend(m for m in extras if m not in models)
        return models

    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_BASIC_PRICE_ID: str | None = None
    STRIPE_PRO_PRICE_ID: str | None = None

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str | None = None

    DEV_SECRET: str = "applyd-dev-secret-change-in-production"
    DEV_MODE: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def supabase_project_ref(self) -> str:
        if self.DATABASE_URL.startswith("sqlite"):
            return "localhost"
        parsed = urlparse(self.DATABASE_URL)
        username = parsed.username or ""
        if username.startswith("postgres.") and "." in username:
            return username.split(".", 1)[1]

        hostname = parsed.hostname or ""
        parts = hostname.split(".")
        if len(parts) >= 4 and parts[0] == "db":
            return parts[1]
        if len(parts) >= 4 and parts[1] == "pooler" and parts[2] == "supabase" and parts[3] == "com":
            raise ValueError("Unable to determine Supabase project ref from pooler hostname; use postgres.<project-ref> username format")
        if len(parts) >= 3 and parts[-2:] == ["supabase", "co"]:
            return parts[0]
        raise ValueError("Unable to determine Supabase project ref from DATABASE_URL")

    @property
    def supabase_jwks_url(self) -> str:
        return f"https://{self.supabase_project_ref}.supabase.co/auth/v1/.well-known/jwks.json"


settings = Settings()
