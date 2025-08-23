import logging
import os
from dotenv import load_dotenv

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
from livekit.agents.llm import function_tool
from livekit.plugins import noise_cancellation, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from .pydantic_llm_adapter import PydanticAgentLLM
from api.core.config import get_settings


logger = logging.getLogger("agent")


load_dotenv(".env.local")


class Assistant(Agent):
  def __init__(self) -> None:
    super().__init__(
      instructions=(
        "You are a helpful voice AI assistant. Keep answers concise and friendly."
      ),
    )

  @function_tool
  async def lookup_weather(self, location: str):
    logger.info(f"Looking up weather for {location}")
    return "sunny with a temperature of 70 degrees."


def prewarm(proc: JobProcess):
  proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
  ctx.log_context_fields = {"room": ctx.room.name}

  settings = get_settings()
  session = AgentSession(
    llm=PydanticAgentLLM(openai_model=os.getenv("LIVEKIT_DEFAULT_LLM", "openai:gpt-4o-mini"), mcp_url=settings.BB_MCP_SERVER_URL or ""),
    stt=openai.STT(model=os.getenv("LIVEKIT_DEFAULT_STT", "gpt-4o-transcribe")),
    tts=openai.TTS(model=os.getenv("LIVEKIT_DEFAULT_TTS_MODEL", "gpt-4o-mini-tts"), voice=os.getenv("LIVEKIT_DEFAULT_TTS_VOICE", "ash")),
    turn_detection=MultilingualModel(),
    vad=ctx.proc.userdata["vad"],
    preemptive_generation=True,
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


if __name__ == "__main__":
  cli.run_app(
    WorkerOptions(
      entrypoint_fnc=entrypoint,
      prewarm_fnc=prewarm,
      agent_name=os.getenv("AGENT_NAME", "teacher-agent"),
    )
  )


