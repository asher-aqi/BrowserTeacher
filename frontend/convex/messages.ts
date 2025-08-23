import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const messagesAppend = mutation({
  args: { sessionId: v.string(), role: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const doc = { sessionId: args.sessionId, role: args.role, content: args.content, createdAt: Date.now() };
    const id = await ctx.db.insert("messages", doc as any);
    return await ctx.db.get(id);
  },
});

export const messagesRecent = query({
  args: { sessionId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const res = await ctx.db
      .query("messages")
      .withIndex("by_session_time", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(args.limit);
    return res.reverse();
  },
});

export const pydanticHistoryGet = query({
  args: { roomId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("pydanticMessages")
      .withIndex("by_room_time", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit);
    return rows.reverse().map((r) => r.messageJson);
  },
});

export const pydanticAppend = mutation({
  args: { roomId: v.string(), messagesJson: v.array(v.any()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const m of args.messagesJson) {
      await ctx.db.insert("pydanticMessages", { roomId: args.roomId, messageJson: m, createdAt: now } as any);
    }
    return { ok: true };
  },
});


