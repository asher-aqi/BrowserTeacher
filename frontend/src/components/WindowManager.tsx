"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface WindowManagerProps {
  left: ReactNode;
  right: ReactNode;
  minLeft?: number;
  maxLeft?: number;
  initialLeft?: number;
  collapsible?: boolean;
}

export default function WindowManager({ left, right, minLeft = 240, maxLeft = 680, initialLeft = 360, collapsible = true }: WindowManagerProps) {
  const [leftWidth, setLeftWidth] = useState<number>(initialLeft);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
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

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
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

  const actualLeftWidth = isCollapsed ? 40 : leftWidth;

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div 
        style={{ width: actualLeftWidth }} 
        className={`h-full relative bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'overflow-hidden' : ''
        }`}
      >
        {collapsible && (
          <button
            onClick={toggleCollapse}
            className="absolute top-3 right-2 z-10 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand drawer" : "Collapse drawer"}
          >
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className={isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
          {left}
        </div>
      </div>
      {!isCollapsed && (
        <div
          onMouseDown={onMouseDown}
          className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
          aria-label="Resize"
        />
      )}
      <div className="flex-1 h-full">
        {right}
      </div>
    </div>
  );
}


