interface BrowserbaseIframeProps {
  liveViewUrl: string;
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
  const iframeUrl = hideNavbar ? `${liveViewUrl}&navbar=false` : liveViewUrl;

  return (
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
  );
}