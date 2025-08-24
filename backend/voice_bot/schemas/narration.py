from __future__ import annotations

from pydantic import BaseModel, Field


class NarrationDecision(BaseModel):
  message: str = Field(..., description="Short narration suitable for TTS—what will or was done")
  act: bool = Field(..., description="Whether to proceed with action tools now")


