"use client";

import { useMaybeRoomContext, useMediaDeviceSelect } from "@livekit/components-react";

type Props = {
  kind: MediaDeviceKind;
  className?: string;
};

export default function DeviceSelect({ kind, className }: Props) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind, room });

  return (
    <select
      value={activeDeviceId}
      onChange={(e) => setActiveMediaDevice(e.target.value)}
      className={className ?? "border rounded px-2 py-1 text-xs"}
      aria-label={`Select ${kind}`}
    >
      {devices.map((d) => (
        <option key={d.deviceId} value={d.deviceId}>
          {d.label || d.deviceId}
        </option>
      ))}
    </select>
  );
}


