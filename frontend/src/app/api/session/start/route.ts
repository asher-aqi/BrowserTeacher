import { NextRequest, NextResponse } from "next/server";
import { Browserbase } from "@browserbasehq/sdk";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Session } from "@/types/lesson";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId } = body as { roomId: string };
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    // Create Browserbase session
    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
    // Types vary across SDK versions; use any to remain flexible during hackathon
    const session: any = await (bb as any).sessions.create({ projectId: process.env.BROWSERBASE_PROJECT_ID });

    // Some SDKs return only partial URLs on create; attempt a retrieve for full fields
    // Use official debug endpoint to get final inspector/live URLs
    const bbSessionId: string = (session.id as string) || "";
    let bbLiveViewUrl = "";
    let bbDevtoolsWssUrl = "";

    try {
      const dbgRes = await fetch(`https://api.browserbase.com/v1/sessions/${bbSessionId}/debug`, {
        method: "GET",
        headers: {
          "X-BB-API-Key": process.env.BROWSERBASE_API_KEY as string,
          "Content-Type": "application/json",
        },
      });
      if (dbgRes.ok) {
        const dbg: any = await dbgRes.json();
        bbLiveViewUrl = dbg.debuggerFullscreenUrl || dbg.debuggerUrl || "";
        bbDevtoolsWssUrl = dbg.wsUrl || (dbg.pages && dbg.pages[0]?.wsUrl) || "";
      }
    } catch {}

    // Fallbacks from initial create if debug isn’t available
    if (!bbLiveViewUrl || !bbDevtoolsWssUrl) {
      const fetched: any = (await ((bb as any).sessions.get?.(session.id) ?? (bb as any).sessions.retrieve?.(session.id))) || session;
      const connectUrl: string =
        fetched.devtoolsWsUrl || fetched.devtoolsUrl || fetched.connectUrl || fetched.devtools_url || fetched.connect_url || "";
      const inspector = fetched.inspectorUrl || fetched.liveViewUrl || fetched.inspector_url || fetched.live_url || "";
      if (!bbLiveViewUrl && inspector) bbLiveViewUrl = inspector;
      if (!bbDevtoolsWssUrl && connectUrl) bbDevtoolsWssUrl = connectUrl;
      if (!bbLiveViewUrl && bbDevtoolsWssUrl) {
        const wssParam = (bbDevtoolsWssUrl as string).replace(/^wss:\/\//, "");
        bbLiveViewUrl = `https://www.browserbase.com/devtools/inspector.html?wss=${encodeURIComponent(wssParam)}&debug=true`;
      }
    }

    console.log("[session.start] bb debug", { id: bbSessionId, bbLiveViewUrl, bbDevtoolsWssUrl });

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
    const convex = new ConvexHttpClient(convexUrl);
    const sessionId = await convex.mutation(api.sessions.sessionsStart, {
      roomId,
      bbSessionId,
      bbLiveViewUrl,
      bbDevtoolsWssUrl,
    });

    return NextResponse.json({ sessionId, roomId, liveViewUrl: bbLiveViewUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}


