import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sessionsStart = mutation({
  args: {
    roomId: v.string(),
    bbSessionId: v.string(),
    bbLiveViewUrl: v.string(),
    bbDevtoolsWssUrl: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("sessions").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).first();
    const doc = {
      roomId: args.roomId,
      bbSessionId: args.bbSessionId,
      bbLiveViewUrl: args.bbLiveViewUrl,
      bbDevtoolsWssUrl: args.bbDevtoolsWssUrl,
      status: "active",
      createdAt: Date.now(),
      endedAt: undefined,
    } as any;
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    const id = await ctx.db.insert("sessions", doc);
    return id;
  },
});

export const sessionGet = query({
  args: { sessionId: v.optional(v.id("sessions")), roomId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sessionId) return await ctx.db.get(args.sessionId);
    if (args.roomId) return await ctx.db.query("sessions").withIndex("by_room", (q) => q.eq("roomId", args.roomId!)).first();
    return null;
  },
});


