from __future__ import annotations

from typing import AsyncIterator, Iterable, Optional
import os
import asyncio
from contextlib import asynccontextmanager, AsyncExitStack

import logging
from pydantic_ai import Agent as PAgent
from pydantic_ai import Tool, RunContext
from pydantic_ai.messages import ModelMessagesTypeAdapter
from pydantic_core import to_jsonable_python
import httpx
from pydantic_ai.mcp import MCPServerStreamableHTTP

# LiveKit LLM base types
from livekit.agents.llm.llm import LLM as LKLLM
from typing import Any
from dataclasses import dataclass
from livekit.agents import get_job_context
from .schemas import LessonPlan, RoomIdOut, NarrationDecision


@dataclass
class Deps:
  room_id: str
  frontend_base: str
  bb_session_id: str
  convex_session_id: str


class PydanticAgentLLM(LKLLM):
  """Adapter that wraps a Pydantic AI Agent to implement LiveKit's LLM interface."""

  def __init__(
    self,
    *,
    openai_model: str,
    mcp_url: str,
    system_prompt: str | None = None,
    openai_api_key_env: str = "OPENAI_API_KEY",
  ) -> None:
    super().__init__()

    # Keep reference for clarity
    self._Deps = Deps

    # (schemas imported at module scope)

    # Tool implementations
    async def get_room_id_tool(ctx: RunContext[Deps]) -> RoomIdOut:
      return RoomIdOut(room_id=ctx.deps.room_id)

    async def session_get_tool(ctx: RunContext[Deps]) -> dict:
      base = ctx.deps.frontend_base
      params: dict[str, str] = {}
      if ctx.deps.convex_session_id:
        params["sessionId"] = ctx.deps.convex_session_id
      elif ctx.deps.room_id:
        params["roomId"] = ctx.deps.room_id
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{base}/api/session", params=params)
        r.raise_for_status()
        return r.json()

    async def lesson_plan_get_tool(ctx: RunContext[Deps]) -> dict:
      base = ctx.deps.frontend_base
      sid = ctx.deps.convex_session_id
      async with httpx.AsyncClient(timeout=10.0) as client:
        logging.getLogger("agent").info("lesson_plan_get", extra={"convex_session_id": sid})
        r = await client.get(f"{base}/api/lesson/plan", params={"sessionId": sid})
        r.raise_for_status()
        data = r.json()
        logging.getLogger("agent").info("lesson_plan_get ok", extra={"has_plan": bool(data), "title": data.get("title", "")})
        return data

    async def lesson_plan_upsert_tool(ctx: RunContext[Deps], plan: LessonPlan) -> dict:
      base = ctx.deps.frontend_base
      sid = ctx.deps.convex_session_id
      async with httpx.AsyncClient(timeout=10.0) as client:
        logging.getLogger("agent").info("lesson_plan_upsert", extra={"convex_session_id": sid, "steps": len(plan.steps)})
        r = await client.post(
          f"{base}/api/lesson/plan",
          json={"sessionId": sid, "plan": plan.model_dump(exclude_none=True)},
        )
        r.raise_for_status()
        data = r.json()
        logging.getLogger("agent").info("lesson_plan_upsert ok", extra={"_id": data.get("_id", "")})
        return data

    async def lesson_step_toggle_tool(ctx: RunContext[Deps], step_id: str, done: bool) -> dict:
      base = ctx.deps.frontend_base
      sid = ctx.deps.convex_session_id
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
          f"{base}/api/lesson/step",
          json={"sessionId": sid, "stepId": step_id, "done": done},
        )
        r.raise_for_status()
        return r.json()

    tools = [
      Tool(get_room_id_tool),
      Tool(session_get_tool),
      Tool(lesson_plan_get_tool),
      Tool(lesson_plan_upsert_tool),
      Tool(lesson_step_toggle_tool),
    ]

    # Track ensured Browserbase sessions by room
    self._bb_session_ready: dict[str, bool] = {}

    # Construct server first, then pass via constructor (Agent.toolsets via ctor)
    # Base prompt string + dynamic strict instructions (registered below)
    self._base_system_prompt = system_prompt or ""

    if mcp_url:
      server = MCPServerStreamableHTTP(url=mcp_url, process_tool_call=self._mcp_process_tool_call)
      self._mcp_server = server
      self._agent = PAgent(openai_model, system_prompt=self._base_system_prompt, deps_type=Deps, tools=tools, toolsets=[server])
      # Allow MCP sampling to use this model
      self._agent.set_mcp_sampling_model()
    else:
      self._mcp_server = None
      self._agent = PAgent(openai_model, system_prompt=self._base_system_prompt, deps_type=Deps, tools=tools)

    # A lightweight narration-only agent with no tools for Phase A
    self._agent_narrate = PAgent(openai_model, system_prompt=self._base_system_prompt, deps_type=Deps, tools=[])

    # Register dynamic system prompt to inject strict Browserbase session rules per run
    @self._agent.system_prompt
    async def _strict_bb_prompt(ctx: RunContext[Deps]) -> str:
      sid = getattr(ctx.deps, "bb_session_id", "")
      rid = getattr(ctx.deps, "room_id", "")
      strict = (
        "\n\nStrict Browserbase session initialization and usage:\n"
        f"- Room: {rid}\n"
        f"- Provided Browserbase session id: {sid}\n"
        "- BEFORE any browsing or page interaction tools, you MUST FIRST call the tool 'browserbase_session_create' with exactly: {\"sessionId\": \"" + (sid or "") + "\"}.\n"
        "- For ALL subsequent Browserbase tool calls, ALWAYS include this session id in arguments as both 'sessionId' and 'session_id'. If the tool accepts an object 'session', set 'session': {id: '" + (sid or "") + "'} as well.\n"
        "- NEVER invent or change the session id. NEVER use placeholder ids like 'browserbase_session_main_*'.\n"
        "- If the session id is missing, call 'session_get' with the room id to retrieve it BEFORE any Browserbase calls.\n"
        "- It is only a single session so never call multisession browser base tools"
      )
      return strict

    # Persistent context management
    self._entered: bool = False
    self._exit_stack: AsyncExitStack | None = None

  async def open(self, room_id: str) -> None:
    if self._entered:
      return
    self._exit_stack = AsyncExitStack()
    if self._mcp_server is not None:
      await self._exit_stack.enter_async_context(self._mcp_server)
    await self._exit_stack.enter_async_context(self._agent)
    self._entered = True

    # Proactively ensure Browserbase session is bound to this MCP connection
    base = os.getenv("FRONTEND_API_BASE", "http://localhost:3000")
    bb_session_id = ""
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        sr = await client.get(f"{base}/api/session", params={"roomId": room_id})
        if sr.status_code == 200:
          sj = sr.json()
          bb_session_id = str(sj.get("bbSessionId", ""))
    except Exception:
      bb_session_id = ""
    if bb_session_id and self._mcp_server is not None:
      try:
        await self._mcp_server.direct_call_tool("browserbase_session_create", {"sessionId": bb_session_id})
        self._bb_session_ready[room_id] = True
        logging.getLogger("agent").info("pre-bound Browserbase session to MCP", extra={"lk_room": room_id, "bb_session_id": bb_session_id})
      except Exception as e:
        logging.getLogger("agent").warning("failed to pre-bind Browserbase session", extra={"lk_room": room_id, "error": str(e)})

  async def close(self) -> None:
    if not self._entered:
      return
    try:
      assert self._exit_stack is not None
      await self._exit_stack.aclose()
    finally:
      self._entered = False
      self._exit_stack = None

  async def _fetch_history(self, room_id: str, limit: int = 1000000) -> list:
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

  async def _agent_run(self, agent: PAgent, *, user_prompt: str, message_history: list, deps: Deps | None) -> tuple[str, list]:
    if self._entered and agent is self._agent:
      result = await agent.run(user_prompt, message_history=message_history, deps=deps)
    else:
      async with agent:
        result = await agent.run(user_prompt, message_history=message_history, deps=deps)
    return (result.output or "", to_jsonable_python(result.new_messages()))

  async def _run_narration(self, room_id: str, user_prompt: str, deps: Deps | None) -> NarrationDecision:
    history_json = await self._fetch_history(room_id) if room_id else []
    history = ModelMessagesTypeAdapter.validate_python(history_json) if history_json else []
    # Ask only for narration; tools are disabled by using the narration agent
    # Return typed decision using Pydantic AI result_type, no manual JSON parsing
    prompt = (
      "You are the Narration phase. Decide if the agent should act now.\n"
      "Rules:\n"
      "- If the request is clear, safe, and you have enough context to proceed, set act=true.\n"
      "- If clarification is needed, or it's risky/destructive, or user confirmation is needed, set act=false.\n"
      "- The narration message should be short (<= 2 sentences), plain text for TTS, no markdown.\n"
      "- Do not call tools.\n"
      f"User request: {user_prompt}\n"
      "Respond with a concise narration and the act flag."
    )
    if self._entered:
      result = await self._agent_narrate.run(prompt, message_history=history, deps=deps, output_type=NarrationDecision)
    else:
      async with self._agent_narrate:
        result = await self._agent_narrate.run(prompt, message_history=history, deps=deps, output_type=NarrationDecision)
    new_msgs = to_jsonable_python(result.new_messages())
    if room_id and new_msgs:
      await self._append_history(room_id, new_msgs)
    return result.output or NarrationDecision(message="", act=False)

  async def _run_action(self, room_id: str, deps: Deps) -> str:
    history_json = await self._fetch_history(room_id) if room_id else []
    history = ModelMessagesTypeAdapter.validate_python(history_json) if history_json else []
    # Perform the narrated actions now; keep result summary short
    prompt = "Proceed to act as narrated. Do not restate the plan. Use tools to complete the step, then reply with one short sentence summary."
    if self._entered:
      result = await self._agent.run(prompt, message_history=history, deps=deps)
    else:
      async with self._agent:
        result = await self._agent.run(prompt, message_history=history, deps=deps)
    new_msgs = to_jsonable_python(result.new_messages())
    if room_id and new_msgs:
      await self._append_history(room_id, new_msgs)
    return result.output or ""

  async def _run_with_history(self, room_id: str, prompt: str) -> str:
    # Kept for compatibility if needed elsewhere; not used by chat() after two-phase mode
    history_json = await self._fetch_history(room_id) if room_id else []
    history = ModelMessagesTypeAdapter.validate_python(history_json) if history_json else []
    base = os.getenv("FRONTEND_API_BASE", "http://localhost:3000")
    bb_session_id = ""
    if room_id:
      try:
        async with httpx.AsyncClient(timeout=10.0) as client:
          sr = await client.get(f"{base}/api/session", params={"roomId": room_id})
          if sr.status_code == 200:
            sj = sr.json()
            bb_session_id = str(sj.get("bbSessionId", ""))
      except Exception:
        bb_session_id = ""
    try:
      logging.getLogger("agent").info(
        "resolved Browserbase session",
        extra={"lk_room": room_id or "", "bb_session_id": bb_session_id or ""},
      )
    except Exception:
      pass
    # Resolve convex session id once for this turn (Convex _id only)
    convex_session_id = ""
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        sr = await client.get(f"{base}/api/session", params={"roomId": room_id})
        if sr.status_code == 200:
          sj = sr.json()
          convex_session_id = str(sj.get("_id", ""))
    except Exception:
      convex_session_id = ""
    deps = self._Deps(room_id=room_id, frontend_base=base, bb_session_id=bb_session_id, convex_session_id=convex_session_id)
    text, new_msgs = await self._agent_run(self._agent, user_prompt=prompt, message_history=history, deps=deps)
    if room_id and new_msgs:
      await self._append_history(room_id, new_msgs)
    return text

  def _extract_prompt_and_room(self, chat_ctx: Any) -> tuple[str, str]:
    prompt = ""
    room_id = ""
    try:
      room_id = get_job_context().room.name or ""
    except Exception:
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
    # Resolve deps (session ids etc.) once per turn
    base = os.getenv("FRONTEND_API_BASE", "http://localhost:3000")
    bb_session_id = ""
    if room_id:
      try:
        async with httpx.AsyncClient(timeout=10.0) as client:
          sr = await client.get(f"{base}/api/session", params={"roomId": room_id})
          if sr.status_code == 200:
            sj = sr.json()
            bb_session_id = str(sj.get("bbSessionId", ""))
      except Exception:
        bb_session_id = ""
    # Resolve convex session id (Convex _id only)
    convex_session_id = ""
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        sr = await client.get(f"{base}/api/session", params={"roomId": room_id})
        if sr.status_code == 200:
          sj = sr.json()
          convex_session_id = str(sj.get("_id", ""))
    except Exception:
      convex_session_id = ""
    deps = self._Deps(room_id=room_id, frontend_base=base, bb_session_id=bb_session_id, convex_session_id=convex_session_id)

    add_message = getattr(chat_ctx, "add_message", None)

    async def _gen():
      # Phase A: narrate with decision
      decision = await self._run_narration(room_id, prompt, deps)
      if callable(add_message) and decision.message:
        maybe = add_message(role="assistant", content=decision.message)
        if asyncio.iscoroutine(maybe):
          await maybe
      if decision.message:
        yield decision.message

      # Phase B: act only if requested
      if decision.act:
        act = await self._run_action(room_id, deps)
        if callable(add_message) and act:
          maybe = add_message(role="assistant", content=act)
          if asyncio.iscoroutine(maybe):
            await maybe
        if act:
          yield act

    try:
      yield _gen()
    finally:
      return

  async def _mcp_process_tool_call(self, ctx: RunContext[Deps], call_tool, name: str, tool_args: dict[str, Any]):
    # Ensure Browserbase session is created/reused before other tools, and inject session id
    try:
      sid = getattr(ctx.deps, "bb_session_id", "")
      room = getattr(ctx.deps, "room_id", "")

      async def ensure_session():
        if not sid:
          return
        if self._bb_session_ready.get(room):
          return
        try:
          # Reuse/create the session explicitly so subsequent tools have an active session server-side
          await call_tool("browserbase_session_create", {"sessionId": sid}, None)
          self._bb_session_ready[room] = True
          logging.getLogger("agent").info("ensured Browserbase session via MCP", extra={"lk_room": room, "bb_session_id": sid})
        except Exception as e:
          logging.getLogger("agent").warning("failed to ensure Browserbase session", extra={"lk_room": room, "error": str(e)})

      # If the current call is not the create tool, ensure session first
      if name != "browserbase_session_create":
        await ensure_session()

      # Inject Browserbase session id on applicable calls
      if sid:
        current = str(tool_args.get("session_id", ""))
        if (not current) or current.startswith("browserbase_session_main_"):
          tool_args = {**tool_args, "session_id": sid, "sessionId": sid}
        # Some tools may accept nested shape
        if isinstance(tool_args.get("session"), dict):
          inner = dict(tool_args["session"])  # copy
          if not inner.get("id"):
            inner["id"] = sid
            tool_args["session"] = inner
      try:
        logging.getLogger("agent").info(
          "MCP tool session injection",
          extra={
            "tool": name,
            "bb_session_id": sid or "",
            "existing_session_id": tool_args.get("session_id") or tool_args.get("sessionId") or "",
          },
        )
      except Exception:
        pass
    except Exception:
      pass
    return await call_tool(name, tool_args, None)


