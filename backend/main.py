import os

# Expose ASGI app for CLI runners (e.g., `hypercorn main:app`)
from api.app import app  # noqa: F401


def main() -> None:
  # Hypercorn only
  import asyncio
  import hypercorn.asyncio  # type: ignore
  from hypercorn.config import Config  # type: ignore

  host = os.getenv("HOST", "0.0.0.0")
  port = int(os.getenv("PORT", "8000"))

  config = Config()
  config.bind = [f"{host}:{port}"]
  config.worker_class = "asyncio"

  async def _run() -> None:
    from api.app import app  # noqa: WPS433
    await hypercorn.asyncio.serve(app, config)

  asyncio.run(_run())


if __name__ == "__main__":
  main()
