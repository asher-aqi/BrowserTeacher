"use client";

import { useCallback } from "react";
import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import DeviceSelect from "./DeviceSelect";

type Props = {
  onStart: () => Promise<void> | void;
  isConnected: boolean;
};

export default function VoiceControlBar({ onStart, isConnected }: Props) {
  const { enabled, toggle } = useTrackToggle({ source: Track.Source.Microphone });

  const handleStart = useCallback(async () => {
    await onStart();
    if (!enabled) await toggle();
  }, [onStart, enabled, toggle]);

  return (
    <div className="fixed left-4 bottom-4 z-50 flex items-center gap-3 bg-white/90 backdrop-blur border rounded-full px-3 py-2 shadow">
      <DeviceSelect kind="audioinput" className="border rounded px-2 py-1 text-xs" />
      <button
        className="text-sm bg-black text-white rounded-full px-3 py-1"
        onClick={() => void (isConnected ? toggle() : handleStart())}
      >
        {isConnected ? (enabled ? "Mute" : "Unmute") : "Start voice"}
      </button>
    </div>
  );
}


