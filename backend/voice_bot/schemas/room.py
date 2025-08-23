from __future__ import annotations

from pydantic import BaseModel


class RoomIdOut(BaseModel):
  room_id: str


