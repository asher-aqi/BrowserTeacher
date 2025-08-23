import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, stepId, done } = body as { sessionId: string; stepId: string; done: boolean };
    if (!sessionId || !stepId) return NextResponse.json({ error: "sessionId and stepId required" }, { status: 400 });
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
    const convex = new ConvexHttpClient(convexUrl);
    const updated = await convex.mutation(api.lesson.stepToggle, { sessionId, stepId, done });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}


