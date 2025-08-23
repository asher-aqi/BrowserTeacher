import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const planUpsert = mutation({
  args: {
    sessionId: v.string(),
    plan: v.object({
      title: v.string(),
      description: v.string(),
      goal: v.string(),
      objective: v.string(),
      userObjective: v.optional(v.string()),
      steps: v.array(
        v.object({
          id: v.string(),
          conceptTitle: v.string(),
          description: v.string(),
          objective: v.string(),
          userObjective: v.optional(v.string()),
          done: v.boolean(),
          order: v.number(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("lessonPlans").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId)).first();
    const doc = {
      sessionId: args.sessionId,
      title: args.plan.title,
      description: args.plan.description,
      goal: args.plan.goal,
      objective: args.plan.objective,
      userObjective: args.plan.userObjective ?? "",
      steps: args.plan.steps,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("lessonPlans", doc as any);
    return await ctx.db.get(id);
  },
});

export const planGet = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("lessonPlans").withIndex("by_session", (q) => q.eq("sessionId", args.sessionId)).first();
  },
});

export const stepToggle = mutation({
  args: { sessionId: v.string(), stepId: v.string(), done: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("lessonPlans")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!plan) return null;
    const steps = (plan.steps as any[]).map((s) => (s.id === args.stepId ? { ...s, done: args.done ?? !s.done } : s));
    await ctx.db.patch(plan._id, { steps, updatedAt: Date.now() } as any);
    return await ctx.db.get(plan._id);
  },
});


