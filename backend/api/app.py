from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
import logging


def get_cors_origins() -> list[str]:
    # Minimal CORS suitable for local dev and Vercel preview; tighten later as needed
    return [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
    ]


app = FastAPI(title="BrowserTeacher API", version="0.1.0")

# Basic logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
from .v1.routes.voice import router as voice_router  # noqa: E402


app.include_router(voice_router, prefix="/api/v1/voice", tags=["voice"]) 


@app.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    return {"status": "ok", "livekit_url": settings.LIVEKIT_URL}


