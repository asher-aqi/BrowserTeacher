from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import uuid
import logging

try:
    # Prefer the modern API module per docs
    from livekit import api as lk_api
except Exception:
    lk_api = None  # type: ignore


router = APIRouter()
log = logging.getLogger("voice")


class TokenRequest(BaseModel):
    identity: str
    room: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    room: str
    ws_url: str


from ...core.config import get_settings


@router.post("/token", response_model=TokenResponse)
def create_token(body: TokenRequest) -> TokenResponse:
    if lk_api is None:
        raise HTTPException(status_code=500, detail="livekit server sdk not installed")

    settings = get_settings()
    api_key = settings.LIVEKIT_API_KEY
    api_secret = settings.LIVEKIT_API_SECRET
    ws_url = settings.LIVEKIT_URL

    room = body.room or f"lesson-{uuid.uuid4()}"
    log.info("minting livekit token", extra={"room": room, "identity": body.identity})

    at = (
        lk_api.AccessToken(api_key, api_secret)
        .with_identity(body.identity)
        .with_grants(
            lk_api.VideoGrants(
                room_join=True,
                room=room,
                can_publish=True,
                can_subscribe=True,
            )
        )
    )

    # Optional: request agent dispatch so a worker auto-joins this room
    try:
        agent_name = get_settings().AGENT_NAME
        if agent_name:
            at = at.with_room_config(
                lk_api.RoomConfiguration(
                    agents=[lk_api.RoomAgentDispatch(agent_name=agent_name, metadata="browserteacher")]
                )
            )
            log.info("added room agent dispatch", extra={"room": room, "agent": agent_name})
    except Exception:  # pragma: no cover
        pass

    token = at.to_jwt()

    resp = TokenResponse(access_token=token, room=room, ws_url=ws_url)
    log.info("issued token", extra={"room": resp.room})
    return resp

