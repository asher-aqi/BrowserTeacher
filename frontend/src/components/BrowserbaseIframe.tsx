"use client";

import BrowserOverlay from "./BrowserOverlay";

interface BrowserbaseIframeProps {
  liveViewUrl?: string;
  hideNavbar?: boolean;
  allowInteraction?: boolean;
  className?: string;
}

export default function BrowserbaseIframe({
  liveViewUrl,
  hideNavbar = false,
  allowInteraction = false,
  className = "w-full h-full",
}: BrowserbaseIframeProps) {
  // const iframeUrl = hideNavbar ? `${liveViewUrl}&navbar=false` : liveViewUrl;
  // hardcode test for now
  const iframeUrl =
    liveViewUrl ||
    "https://www.browserbase.com/devtools/inspector.html?wss=connect.browserbase.com/debug/3dd7db04-f461-46c2-9d48-a5a7d92cc996/devtools/page/CA7182C77A0121A08627B51C2602E514?debug=true";

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Iframe Container */}
      <div className="absolute inset-0 z-0">
        <iframe
          src={iframeUrl}
          sandbox="allow-same-origin allow-scripts"
          allow="clipboard-read; clipboard-write"
          className={className}
          style={{
            pointerEvents: allowInteraction ? "auto" : "none",
            border: "none",
          }}
        />
      </div>

      {/* Browser Overlay System */}
      <BrowserOverlay className="absolute inset-0 z-10" />
    </div>
  );
}
