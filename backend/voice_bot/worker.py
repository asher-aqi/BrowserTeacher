import logging
import os
from dotenv import load_dotenv
import httpx
import os
import contextlib

from livekit.agents import (
  NOT_GIVEN,
  Agent,
  AgentFalseInterruptionEvent,
  AgentSession,
  JobContext,
  JobProcess,
  MetricsCollectedEvent,
  RoomInputOptions,
  WorkerOptions,
  cli,
  metrics,
)

from livekit.agents import function_tool, RunContext, ToolError, get_job_context, mcp
from livekit.plugins import noise_cancellation, openai, silero, deepgram, cartesia
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from .pydantic_llm_adapter import PydanticAgentLLM
from api.core.config import get_settings


logger = logging.getLogger("agent")


load_dotenv(".env.local")


# Optional Logfire instrumentation
with contextlib.suppress(Exception):
  if os.getenv("LOGFIRE_ENABLE", "1").lower() in ("1", "true", "yes"):
    import logfire

    logfire.configure(scrubbing=False)
    # Instrument Pydantic AI and HTTPX for full visibility of prompts, tools, and HTTP calls
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx(capture_all=True)


ASSISTANT_SYSTEM_PROMPT = (
  """
You are BrowserTeacher. You teach software by operating a browser for the user. You speak clearly, briefly, and continuously. You receive speech-to-text input and your replies are text for text-to-speech. Do not use markdown, lists, or code blocks. Keep sentences short.

Interaction style:
- First narrate what you will do in 1–2 short sentences.
- Then do the action with tools.
- After tools finish, say one short sentence about the result.
- If an action will be long, say brief progress updates between steps.

Tool rules:
- Browser session is already prepared and kept alive. Do not invent session ids.
- Call browserbase_session_create only if the session is not yet bound.
- For all Browserbase tools, use the already bound session. Do not generate placeholder ids.

Lesson plan rules:
- After the user states a learning goal, create a lesson plan using the lesson plan tool. Include steps with conceptTitle, description, objective, order.
- When you complete or undo a concept, update its done state with the lesson step toggle tool immediately.
- Assume Convex updates the UI in real time; mention only what changed unless the user asks for the full plan.

Voice UX rules:
- Never pause silently for long. Narrate first, then act, then summarize.
- Keep each spoken part concise. Prefer two short sentences over one long sentence.
- Avoid filler words.

Safety:
- Ask one clarifying question only when truly necessary.
- If a tool fails, say a short error and the next action.
"""
)


class Assistant(Agent):
  def __init__(self) -> None:
    super().__init__(
      instructions=(ASSISTANT_SYSTEM_PROMPT),
    )

  def _frontend_base(self) -> str:
    return os.getenv("FRONTEND_API_BASE", "http://localhost:3000")

  @function_tool()
  async def get_room_id(self, context: RunContext) -> str:
    """Return the current LiveKit room id/name for this session."""
    try:
      room = get_job_context().room
      return room.name
    except Exception as e:
      raise ToolError(f"Failed to resolve current room id: {e}")

  @function_tool()
  async def session_get(self, context: RunContext, session_id: str | None = None, room_id: str | None = None) -> dict:
    """Fetch the current session metadata (Browserbase session info, etc).

    Args:
      session_id: Optional Backend/Convex session id if known.
      room_id: Optional LiveKit room id; if provided and session_id is not, the server will resolve the session by room.
    Returns: JSON session object from the frontend API.
    """
    base = self._frontend_base()
    params = {}
    if session_id:
      params["sessionId"] = session_id
    if room_id:
      params["roomId"] = room_id
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{base}/api/session", params=params)
        r.raise_for_status()
        return r.json()
    except Exception as e:
      raise ToolError(f"Failed to fetch session: {e}")

  @function_tool()
  async def lesson_plan_get(self, context: RunContext, session_id: str) -> dict:
    """Get the current lesson plan for a session.

    Args:
      session_id: The Backend/Convex session id.
    Returns: LessonPlan JSON (title, description, goal, objective, steps[]).
    """
    base = self._frontend_base()
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{base}/api/lesson/plan", params={"sessionId": session_id})
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
      # 404 means not found — surface a friendly message
      if e.response is not None and e.response.status_code == 404:
        return {"error": "not_found"}
      raise ToolError(f"Failed to get lesson plan: {e}")
    except Exception as e:
      raise ToolError(f"Failed to get lesson plan: {e}")

  @function_tool()
  async def lesson_plan_upsert(self, context: RunContext, session_id: str, plan: dict) -> dict:
    """Create or update the lesson plan for this session.

    Args:
      session_id: The Backend/Convex session id.
      plan: A LessonPlan object with fields: title, description, goal, objective, optional userObjective, and steps[].
            Each step must include: id, conceptTitle, description, objective, optional userObjective, done, order.
    Returns: The stored plan.
    """
    base = self._frontend_base()
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{base}/api/lesson/plan", json={"sessionId": session_id, "plan": plan})
        r.raise_for_status()
        return r.json()
    except Exception as e:
      raise ToolError(f"Failed to upsert lesson plan: {e}")

  @function_tool()
  async def lesson_step_toggle(self, context: RunContext, session_id: str, step_id: str, done: bool) -> dict:
    """Mark a lesson step done/undone and persist progress.

    Args:
      session_id: The Backend/Convex session id.
      step_id: The step id from the lesson plan.
      done: True to mark completed; False to unmark.
    Returns: Updated step/plan fragment.
    """
    base = self._frontend_base()
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{base}/api/lesson/step", json={"sessionId": session_id, "stepId": step_id, "done": done})
        r.raise_for_status()
        return r.json()
    except Exception as e:
      raise ToolError(f"Failed to toggle lesson step: {e}")


def prewarm(proc: JobProcess):
  proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
  ctx.log_context_fields = {"room": ctx.room.name}

  settings = get_settings()

  # Toggle between built-in OpenAI LLM and the Pydantic AI wrapper via env
  use_pydantic = os.getenv("USE_PYDANTIC_LLM", "0").lower() in ("1", "true", "yes")
  if use_pydantic:
    llm_node = PydanticAgentLLM(
      openai_model=os.getenv("LIVEKIT_DEFAULT_LLM", "openai:gpt-4.1-mini"),
      mcp_url=(settings.BB_MCP_SERVER_URL or ""),
      system_prompt=ASSISTANT_SYSTEM_PROMPT,
    )
  else:
    llm_node = openai.LLM(model=os.getenv("LIVEKIT_DEFAULT_LLM", "gpt-4o-mini"))

  # Register BrowserBase MCP server for native LiveKit path (not using pydantic)
  mcp_servers = []
  if not use_pydantic and (settings.BB_MCP_SERVER_URL or ""):
    try:
      mcp_servers = [mcp.MCPServerHTTP(settings.BB_MCP_SERVER_URL)]
    except Exception as e:
      logger.warning(f"Failed to initialize MCP server: {e}")

  session = AgentSession(
    llm=llm_node,
    stt=deepgram.STT(model=os.getenv("LIVEKIT_DEFAULT_STT", "nova-3"), language="multi"),
    tts=cartesia.TTS(voice=os.getenv("LIVEKIT_DEFAULT_TTS_VOICE", "6f84f4b8-58a2-430c-8c79-688dad597532")),
    turn_detection=MultilingualModel(),
    vad=ctx.proc.userdata["vad"],
    preemptive_generation=True,
    mcp_servers=mcp_servers,
  )

  @session.on("agent_false_interruption")
  def _on_agent_false_interruption(ev: AgentFalseInterruptionEvent):
    logger.info("false positive interruption, resuming")
    session.generate_reply(instructions=ev.extra_instructions or NOT_GIVEN)

  usage_collector = metrics.UsageCollector()

  @session.on("metrics_collected")
  def _on_metrics_collected(ev: MetricsCollectedEvent):
    metrics.log_metrics(ev.metrics)
    usage_collector.collect(ev.metrics)

  async def log_usage():
    summary = usage_collector.get_summary()
    logger.info(f"Usage: {summary}")

  ctx.add_shutdown_callback(log_usage)

  await session.start(
    agent=Assistant(),
    room=ctx.room,
    room_input_options=RoomInputOptions(
      noise_cancellation=noise_cancellation.BVC(),
    ),
  )

  await ctx.connect()

  # Persist Pydantic agent and MCP connection for the duration of the room
  try:
    if use_pydantic and hasattr(llm_node, "open"):
      await llm_node.open(ctx.room.name)
  except Exception as e:
    logger.warning(f"failed to open persistent agent context: {e}")

  async def _shutdown():
    try:
      if use_pydantic and hasattr(llm_node, "close"):
        await llm_node.close()
    except Exception:
      pass

  ctx.add_shutdown_callback(_shutdown)


if __name__ == "__main__":
  cli.run_app(
    WorkerOptions(
      entrypoint_fnc=entrypoint,
      prewarm_fnc=prewarm,
      agent_name=os.getenv("AGENT_NAME", "teacher-agent"),
    )
  )


