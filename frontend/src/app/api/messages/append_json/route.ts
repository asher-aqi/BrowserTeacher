import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, messagesJson } = body as { roomId: string; messagesJson: unknown[] };
    if (!roomId || !Array.isArray(messagesJson)) {
      return NextResponse.json({ error: "roomId and messagesJson required" }, { status: 400 });
    }
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
    await convex.mutation(api.messages.pydanticAppend, { roomId, messagesJson });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}


