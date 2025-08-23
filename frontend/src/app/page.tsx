import Image from "next/image";
import BrowserbaseIframe from "@/components/BrowserbaseIframe";

export default function Home() {
  // change url when needed
  const exampleLiveViewUrl =
    "https://www.browserbase.com/devtools/inspector.html?wss=connect.browserbase.com/debug/904bc184-5d6c-4424-9cc2-aae04a41bbe5/devtools/page/B41E1B6F229047B48DAE15193F017A8B?debug=true";

  return (
    <div className="font-sans min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Browserbase Live View
        </h1>

        <div className="mb-8">
          <div className="w-full h-[600px] border rounded-lg overflow-hidden">
            <BrowserbaseIframe
              liveViewUrl={exampleLiveViewUrl}
              hideNavbar={false}
              allowInteraction={true}
              className="w-full h-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
