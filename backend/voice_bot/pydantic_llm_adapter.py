from __future__ import annotations

from typing import AsyncIterator, Iterable, Optional
import os
import asyncio
from contextlib import asynccontextmanager

from pydantic_ai import Agent as PAgent
from pydantic_ai.messages import ModelMessagesTypeAdapter
from pydantic_core import to_jsonable_python
import httpx
from pydantic_ai.mcp import MCPServerStreamableHTTP

# LiveKit LLM base types
from livekit.agents.llm.llm import LLM as LKLLM
from typing import Any


class PydanticAgentLLM(LKLLM):
  """Adapter that wraps a Pydantic AI Agent to implement LiveKit's LLM interface."""

  def __init__(self, *, openai_model: str, mcp_url: str, openai_api_key_env: str = "OPENAI_API_KEY") -> None:
    super().__init__()
    # Construct server first, then pass via constructor (Agent.toolsets via ctor)
    if mcp_url:
      server = MCPServerStreamableHTTP(url=mcp_url)
      self._agent = PAgent(openai_model, toolsets=[server])
      # Allow MCP sampling to use this model
      self._agent.set_mcp_sampling_model()
    else:
      self._agent = PAgent(openai_model)

  async def _fetch_history(self, room_id: str, limit: int = 100) -> list:
    # Fetch Pydantic message JSON array from Next.js route
    async with httpx.AsyncClient(timeout=10.0) as client:
      base = os.getenv("FRONTEND_API_BASE", "http://localhost:3000")
      r = await client.get(f"{base}/api/messages/history_json", params={"roomId": room_id, "limit": str(limit)})
      r.raise_for_status()
      return r.json()

  async def _append_history(self, room_id: str, new_messages: list) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
      base = os.getenv("FRONTEND_API_BASE", "http://localhost:3000")
      await client.post(f"{base}/api/messages/append_json", json={"roomId": room_id, "messagesJson": new_messages})

  async def _run_with_history(self, room_id: str, prompt: str) -> str:
    history_json = await self._fetch_history(room_id, limit=100) if room_id else []
    history = ModelMessagesTypeAdapter.validate_python(history_json) if history_json else []
    async with self._agent:
      result = await self._agent.run(prompt, message_history=history)
      new_msgs = to_jsonable_python(result.new_messages())
      if room_id and new_msgs:
        await self._append_history(room_id, new_msgs)
      return result.output or ""

  def _extract_prompt_and_room(self, chat_ctx: Any) -> tuple[str, str]:
    prompt = ""
    room_id = ""
    items = getattr(chat_ctx, "items", None) or getattr(chat_ctx, "messages", None) or []
    for item in items:
      role = getattr(item, "role", getattr(item, "sender", ""))
      content = getattr(item, "content", "")
      if role == "user":
        if isinstance(content, list):
          text_parts = []
          for p in content:
            if isinstance(p, dict) and "text" in p:
              text_parts.append(str(p["text"]))
            else:
              text_parts.append(str(p))
          if any(text_parts):
            prompt = "\n".join([t for t in text_parts if t])
        else:
          prompt = str(content) or prompt
      rid = getattr(item, "room", "")
      if rid and not room_id:
        room_id = rid
    return prompt, room_id

  @asynccontextmanager
  async def chat(self, chat_ctx: Any, **kwargs):  # v1 calls chat(chat_ctx=...)
    prompt, room_id = self._extract_prompt_and_room(chat_ctx)
    text = await self._run_with_history(room_id, prompt)
    add_message = getattr(chat_ctx, "add_message", None)
    if callable(add_message) and text:
      maybe = add_message(role="assistant", content=text)
      if asyncio.iscoroutine(maybe):
        await maybe

    async def _gen():
      if text:
        yield text

    try:
      yield _gen()
    finally:
      return


