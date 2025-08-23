import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const limit = Number(searchParams.get("limit") || 100);
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
  const rows = await convex.query(api.messages.pydanticHistoryGet, { roomId, limit });
  return NextResponse.json(rows);
}


