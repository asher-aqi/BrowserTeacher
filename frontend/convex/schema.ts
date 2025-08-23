import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    roomId: v.string(),
    bbSessionId: v.string(),
    bbLiveViewUrl: v.string(),
    bbDevtoolsWssUrl: v.string(),
    status: v.string(),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index("by_room", ["roomId"]),

  lessonPlans: defineTable({
    sessionId: v.string(),
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
    updatedAt: v.number(),
  }).index("by_session", ["sessionId"]),

  messages: defineTable({
    sessionId: v.string(),
    role: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_session_time", ["sessionId", "createdAt"]),

  pydanticMessages: defineTable({
    roomId: v.string(),
    messageJson: v.any(),
    createdAt: v.number(),
  }).index("by_room_time", ["roomId", "createdAt"]),
});


