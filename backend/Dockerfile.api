# syntax=docker/dockerfile:1

# Python 3.12 with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Enable bytecode compilation and copy mode for mounted volumes
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies using the lockfile (without installing project code)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Add the backend source and install the project
COPY . /app
RUN uv sync --frozen --no-dev

# Expose default port (Railway will set PORT)
EXPOSE 8000

# Run Hypercorn; bind to IPv6 any with fallback to 8000
CMD ["sh", "-lc", "uv run hypercorn main:app --bind [::]:${PORT:-8000}"]


