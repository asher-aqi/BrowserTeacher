import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { LessonPlan } from "@/types/lesson";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
  const convex = new ConvexHttpClient(convexUrl);
  const plan = await convex.query(api.lesson.planGet, { sessionId });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId: string; plan: LessonPlan };
    if (!body?.sessionId || !body?.plan) return NextResponse.json({ error: "sessionId and plan required" }, { status: 400 });
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;
    const convex = new ConvexHttpClient(convexUrl);
    const plan = await convex.mutation(api.lesson.planUpsert, { sessionId: body.sessionId, plan: body.plan });
    return NextResponse.json(plan);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}


