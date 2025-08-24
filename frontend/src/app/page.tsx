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
  const [identity, setIdentity] = useState<string>(
    () => `user-${crypto.randomUUID().slice(0, 8)}`
  );

  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string | undefined;
  const [sessionId, setSessionId] = useState<string | null>(null); // Convex session id
  // Subscribe to plan by Convex session id
  const plan = useQuery(api.lesson.planGet, sessionId ? { sessionId } : "skip");

  // Debug: observe session and plan updates
  useEffect(() => {
    logger.info("sessionId changed", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (plan === undefined) {
      logger.info("plan query loading or skipped", { sessionId, state: plan });
    } else if (!plan) {
      logger.info("plan not found for session", { sessionId });
    } else {
      logger.info("plan updated", {
        sessionId,
        title: (plan as any)?.title,
        steps: (plan as any)?.steps?.length,
      });
    }
  }, [plan, sessionId]);

  const startVoice = async () => {
    logger.info("startVoice called", { identity, roomName });
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
    const res = await fetch(`${base}/api/v1/voice/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, room: `lesson-${roomName}` }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      access_token: string;
      room: string;
      ws_url: string;
    };
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
      const s = (await startRes.json()) as {
        sessionId: string;
        roomId: string;
        liveViewUrl: string;
        bbSessionId?: string;
      };
      logger.info("session started", s);
      setLiveViewUrl(s.liveViewUrl);
      setSessionId(s.sessionId);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-white">
      <LiveKitRoom
        token={token ?? undefined}
        serverUrl={serverUrl ?? undefined}
        connect={Boolean(token && serverUrl)}
        audio={true}
      >
        <RoomAudioRenderer />

        <WindowManager
          left={
            <div className="h-screen flex flex-col relative">
              <div className="p-4 border-b border-gray-200 font-semibold text-gray-900 bg-gray-50">
                <h2 className="text-lg">Browser Teacher</h2>
              </div>
              <div
                className="flex-1 overflow-auto p-4"
                style={{ paddingBottom: "140px" }}
              >
                <LessonPlan plan={plan ?? null} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 mt-36">
                <VoiceControlBar
                  onStart={startVoice}
                  isConnected={Boolean(token)}
                />
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
                <div className="w-full h-full grid place-items-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🌐</div>
                    <div className="text-lg font-medium mb-2">
                      Browser Ready
                    </div>
                    <div className="text-sm">
                      Start voice to initialize the browser session
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </LiveKitRoom>
    </div>
  );
}
