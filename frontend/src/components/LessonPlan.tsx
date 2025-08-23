"use client";

import type { LessonPlan as LessonPlanType, LessonStep } from "@/types/lesson";

interface Props {
  plan?: LessonPlanType | null;
}

export default function LessonPlan({ plan }: Props) {
  if (!plan) {
    return (
      <div className="w-full">
        <div className="text-sm text-gray-500">No lesson plan yet</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="font-semibold text-sm mb-2">{plan.title}</div>
      <div className="text-xs text-gray-600 mb-3">{plan.description}</div>
      <div className="text-xs mb-2"><span className="font-medium">Goal:</span> {plan.goal}</div>
      <div className="text-xs mb-4"><span className="font-medium">Objective:</span> {plan.objective}</div>
      {plan.userObjective ? (
        <div className="text-xs mb-4"><span className="font-medium">User objective:</span> {plan.userObjective}</div>
      ) : null}
      <ul className="space-y-3">
        {plan.steps.sort((a, b) => a.order - b.order).map((s: LessonStep) => (
          <li key={s.id} className="border rounded p-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{s.conceptTitle}</div>
              <input type="checkbox" checked={s.done} readOnly className="accent-black" />
            </div>
            <div className="text-xs text-gray-600 mt-1">{s.description}</div>
            <div className="text-xs mt-1"><span className="font-medium">Objective:</span> {s.objective}</div>
            {s.userObjective ? (
              <div className="text-xs mt-1"><span className="font-medium">User:</span> {s.userObjective}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}


