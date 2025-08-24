from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Only the variables we actually use
    LIVEKIT_URL: str = "wss://your-livekit.example"
    LIVEKIT_API_KEY: str = "lk_api_key_placeholder"
    LIVEKIT_API_SECRET: str = "lk_api_secret_placeholder"
    OPENAI_API_KEY: str | None = None
    BB_MCP_SERVER_URL: str | None = None
    AGENT_NAME: str = "teacher-agent"

    # Optional runtime knobs
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Railway / Frontend discovery (optional)
    RAILWAY_PUBLIC_DOMAIN: str | None = None
    FRONTEND_PUBLIC_DOMAIN: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

