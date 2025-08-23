"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

interface VoiceWidgetProps {
  onStart: () => Promise<void> | void;
  isConnected: boolean;
}

export default function VoiceWidget({ onStart, isConnected }: VoiceWidgetProps) {
  const room = useRoomContext();
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  useEffect(() => {
    if (!room) return;

    const handleActiveSpeakers = () => {
      const speaking = room.activeSpeakers.some((p) => p.sid !== room.localParticipant?.sid);
      setAgentSpeaking(speaking);
    };

    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    };
  }, [room]);

  const dotClasses = useMemo(() => {
    return [
      "w-4",
      "h-4",
      "rounded-full",
      agentSpeaking ? "bg-green-500" : "bg-gray-400",
      "shadow",
    ].join(" ");
  }, [agentSpeaking]);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-white/80 backdrop-blur border rounded-full px-3 py-2">
      <div className={dotClasses} />
      {!isConnected ? (
        <button
          onClick={() => void onStart()}
          className="text-sm bg-black text-white rounded-full px-3 py-1"
        >
          Start voice
        </button>
      ) : (
        <span className="text-xs text-gray-700">{agentSpeaking ? "Agent speaking" : "Idle"}</span>
      )}
    </div>
  );
}


