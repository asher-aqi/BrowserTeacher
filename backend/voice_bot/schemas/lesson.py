from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class LessonStep(BaseModel):
  id: str
  conceptTitle: str
  description: str
  objective: str
  userObjective: Optional[str] = None
  done: bool
  order: int


class LessonPlan(BaseModel):
  title: str
  description: str
  goal: str
  objective: str
  userObjective: Optional[str] = None
  steps: list[LessonStep]


