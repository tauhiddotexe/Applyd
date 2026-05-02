from urllib.parse import urlparse

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-5.5"
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    STRIPE_API_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_BASIC_PRICE_ID: str | None = None
    STRIPE_PRO_PRICE_ID: str | None = None
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def supabase_project_ref(self) -> str:
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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
