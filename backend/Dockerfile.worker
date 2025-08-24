# syntax=docker/dockerfile:1

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . /app
RUN uv sync --frozen --no-dev

# Expected runtime envs:
# - LIVEKIT_URL
# - LIVEKIT_API_KEY
# - LIVEKIT_API_SECRET
# - OPENAI_API_KEY (optional)
# - FRONTEND_API_BASE (e.g., https://<frontend>.up.railway.app)
# - AGENT_NAME (optional, default teacher-agent)
# - BB_MCP_SERVER_URL (optional)

CMD ["sh", "-lc", "uv run python -m voice_bot.worker start"]


