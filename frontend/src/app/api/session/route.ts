import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const roomId = searchParams.get("roomId");
  if (!sessionId && !roomId) return NextResponse.json({ error: "sessionId or roomId required" }, { status: 400 });
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
  const convex = new ConvexHttpClient(convexUrl);
  const s = await convex.query(api.sessions.sessionGet, {
    sessionId: (sessionId as any) || undefined,
    roomId: roomId || undefined,
  });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}


