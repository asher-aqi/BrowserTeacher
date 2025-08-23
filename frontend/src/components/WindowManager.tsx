"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface WindowManagerProps {
  left: ReactNode;
  right: ReactNode;
  minLeft?: number;
  maxLeft?: number;
  initialLeft?: number;
}

export default function WindowManager({ left, right, minLeft = 240, maxLeft = 680, initialLeft = 360 }: WindowManagerProps) {
  const [leftWidth, setLeftWidth] = useState<number>(initialLeft);
  const dragging = useRef(false);

  const onMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const next = Math.max(minLeft, Math.min(maxLeft, e.clientX));
    setLeftWidth(next);
  }, [minLeft, maxLeft]);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    const mm = (e: MouseEvent) => onMouseMove(e);
    const mu = () => stopDrag();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [onMouseMove, stopDrag]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div style={{ width: leftWidth }} className="h-full relative bg-white/90 backdrop-blur border-r">
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
        aria-label="Resize"
      />
      <div className="flex-1 h-full">
        {right}
      </div>
    </div>
  );
}


