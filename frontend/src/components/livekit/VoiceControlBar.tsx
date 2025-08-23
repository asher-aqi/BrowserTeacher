"use client";

import { useCallback, useState, useEffect } from "react";
import {
  useTrackToggle,
  useVoiceAssistant,
  useRemoteParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import DeviceSelect from "./DeviceSelect";

type Props = {
  onStart: () => Promise<void> | void;
  isConnected: boolean;
};

export default function VoiceControlBar({ onStart, isConnected }: Props) {
  const { enabled, toggle } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const [isTalking, setIsTalking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [waveHeights, setWaveHeights] = useState([10, 15, 20, 12, 8]);
  const [recordWaveHeights, setRecordWaveHeights] = useState([
    8, 12, 16, 10, 14,
  ]);

  // Try to detect voice assistant activity
  const voiceAssistant = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();

  // Monitor voice assistant state directly
  useEffect(() => {
    if (voiceAssistant?.state) {
      setIsTalking(voiceAssistant.state === "speaking");
    }
  }, [voiceAssistant?.state]);

  // Fallback: detect if any remote participant is speaking by checking if tracks exist and are not muted
  useEffect(() => {
    if (remoteParticipants.length > 0) {
      const isSpeaking = remoteParticipants.some((participant) =>
        Array.from(participant.audioTrackPublications.values()).some(
          (pub) => pub.track && !pub.isMuted && pub.isEnabled
        )
      );

      // Only update if voice assistant isn't providing state
      if (!voiceAssistant?.state) {
        setIsTalking(isSpeaking);
      }
    }
  }, [remoteParticipants, voiceAssistant?.state]);

  // Animate wave heights when talking
  useEffect(() => {
    if (isTalking) {
      const interval = setInterval(() => {
        setWaveHeights((prev) => prev.map(() => Math.random() * 20 + 5));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isTalking]);

  // Animate wave heights when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordWaveHeights((prev) => prev.map(() => Math.random() * 18 + 6));
      }, 120);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Monitor microphone state for recording animation
  useEffect(() => {
    setIsRecording(isConnected && enabled);
  }, [isConnected, enabled]);

  const handleStart = useCallback(async () => {
    await onStart();
    if (!enabled) await toggle();
  }, [onStart, enabled, toggle]);

  // Test function to simulate talking (for development)
  const handleTestTalking = useCallback(() => {
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 3000);
  }, []);

  // Test function to simulate recording (for development)
  const handleTestRecording = useCallback(() => {
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 3000);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <DeviceSelect
        kind="audioinput"
        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <button
        className={`text-sm rounded-md px-4 py-3 font-medium transition-all duration-200 w-full relative overflow-hidden h-12 ${
          isTalking
            ? "bg-green-500 text-white animate-pulse shadow-lg"
            : isRecording && !isTalking
              ? "bg-red-500 text-white animate-pulse shadow-lg"
              : "bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg"
        }`}
        onClick={() => void (isConnected ? toggle() : handleStart())}
      >
        {isTalking && (
          <>
            {/* Animated background waves for talking */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 animate-pulse opacity-75"></div>

            {/* Sound wave animation for talking */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1 h-6">
                {waveHeights.map((height, i) => (
                  <div
                    key={`talk-${i}`}
                    className="w-1 bg-white rounded-full transition-all duration-150 opacity-80"
                    style={{
                      height: `${Math.min(height, 20)}px`,
                      maxHeight: '20px'
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {isRecording && !isTalking && (
          <>
            {/* Animated background waves for recording */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 animate-pulse opacity-75"></div>

            {/* Sound wave animation for recording */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1 h-6">
                {recordWaveHeights.map((height, i) => (
                  <div
                    key={`record-${i}`}
                    className="w-1 bg-white rounded-full transition-all duration-150 opacity-80"
                    style={{
                      height: `${Math.min(height, 18)}px`,
                      maxHeight: '18px'
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {isTalking
            ? " "
            : isRecording && !isTalking
              ? " "
              : isConnected
                ? enabled
                  ? "Mute Microphone"
                  : "Unmute Microphone"
                : "Speak"}
        </span>
      </button>

      {/* Test buttons for development */}
      {process.env.NODE_ENV === "development" && (
        <div className="flex gap-2">
          <button
            onClick={handleTestTalking}
            className="text-xs px-2 py-1 border border-green-500/30 rounded text-green-600 hover:bg-green-500/10 flex-1"
          >
            Animate Speaking
          </button>
          <button
            onClick={handleTestRecording}
            className="text-xs px-2 py-1 border border-red-500/30 rounded text-red-600 hover:bg-red-500/10 flex-1"
          >
            Animate Recording
          </button>
        </div>
      )}
    </div>
  );
}
