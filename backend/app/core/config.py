from urllib.parse import urlparse

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str
    # Production: Set these via environment variables
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://dpjpe49st5qyi.cloudfront.net"
    FRONTEND_URL: str = "http://127.0.0.1:5173"
    LOG_LEVEL: str = "INFO"
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "openrouter/free"
    OPENROUTER_FALLBACK_MODELS: str = (
        "meta-llama/llama-3.3-70b-instruct:free,"
        "nvidia/nemotron-3-nano-30b-a3b:free,"
        "qwen/qwen3-next-80b-a3b-instruct:free"
    )

    @property
    def model_fallback_chain(self) -> list[str]:
        models = [self.OPENROUTER_MODEL]
        extras = [m.strip() for m in self.OPENROUTER_FALLBACK_MODELS.split(",") if m.strip()]
        models.extend(m for m in extras if m not in models)
        return models
    
    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_BASIC_PRICE_ID: str | None = None
    STRIPE_PRO_PRICE_ID: str | None = None
    
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str | None = None

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

    # Dev mode: secret for local JWT signing (bypasses Supabase)
    # Must be overridden via env var in production
    DEV_SECRET: str = "applyd-dev-secret-change-in-production"
    DEV_MODE: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
