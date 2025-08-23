import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const limit = Number(searchParams.get("limit") || 50);
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
  const convex = new ConvexHttpClient(convexUrl);
  const msgs = await convex.query(api.messages.messagesRecent, { sessionId, limit });
  return NextResponse.json(msgs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, role, content } = body as { sessionId: string; role: "user" | "assistant" | "system"; content: string };
    if (!sessionId || !role || !content) return NextResponse.json({ error: "sessionId, role, content required" }, { status: 400 });
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
    const convex = new ConvexHttpClient(convexUrl);
    const msg = await convex.mutation(api.messages.messagesAppend, { sessionId, role, content });
    return NextResponse.json(msg);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}


