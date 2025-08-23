"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import BrowserbaseIframe from "@/components/BrowserbaseIframe";
import VoiceControlBar from "@/components/livekit/VoiceControlBar";
import LessonPlan from "@/components/LessonPlan";
import WindowManager from "@/components/WindowManager";
import { logger } from "@/lib/logger";
import { ConvexReactClient, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>(() => crypto.randomUUID());
  const [identity, setIdentity] = useState<string>(() => `user-${crypto.randomUUID().slice(0, 8)}`);

  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string | undefined;
  const [sessionId, setSessionId] = useState<string | null>(null);
  // subscribe to plan by sessionId once available
  const plan = useQuery(api.lesson.planGet, sessionId ? { sessionId } : "skip");

  const startVoice = async () => {
    logger.info("startVoice called", { identity, roomName });
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
    const res = await fetch(`${base}/api/v1/voice/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, room: `lesson-${roomName}` }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { access_token: string; room: string; ws_url: string };
    logger.info("received token", { room: data.room });
    setToken(data.access_token);
    setServerUrl(data.ws_url);
    setRoomName(data.room);

    // Start app session (Browserbase + persistence)
    const startRes = await fetch(`/api/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: data.room }),
    });
    if (startRes.ok) {
      const s = (await startRes.json()) as { sessionId: string; roomId: string; liveViewUrl: string };
      logger.info("session started", s);
      setLiveViewUrl(s.liveViewUrl);
      setSessionId(s.sessionId);
    }
  };

  return (
    <div className="font-sans min-h-screen">
      <LiveKitRoom
        token={token ?? undefined}
        serverUrl={serverUrl ?? undefined}
        connect={Boolean(token && serverUrl)}
        audio={true}
      >
        <RoomAudioRenderer />

        <WindowManager
          left={
            <div className="h-full flex flex-col">
              <div className="p-3 border-b font-semibold">Lesson Plan</div>
              <div className="flex-1 overflow-auto p-3">
                <LessonPlan plan={plan ?? null} />
              </div>
              <div className="p-3 border-t">
                <div className="text-xs text-gray-500">Voice</div>
              </div>
            </div>
          }
          right={
            <div className="w-full h-screen">
              {liveViewUrl ? (
                <BrowserbaseIframe
                  liveViewUrl={liveViewUrl}
                  hideNavbar={false}
                  allowInteraction={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-sm text-gray-500">
                  Start voice to initialize the browser
                </div>
              )}
            </div>
          }
        />

        <VoiceControlBar onStart={startVoice} isConnected={Boolean(token)} />
      </LiveKitRoom>
    </div>
  );
}
