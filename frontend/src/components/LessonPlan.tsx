"use client";

import type { LessonPlan as LessonPlanType, LessonStep } from "@/types/lesson";

interface Props {
  plan?: LessonPlanType | null;
}

export default function LessonPlan({ plan }: Props) {
  if (!plan) {
    return (
      <div className="w-full text-center py-8">
        <div className="text-4xl mb-3">📚</div>
        <div className="text-gray-500 font-medium">No lesson plan yet</div>
        <div className="text-xs text-gray-400 mt-1">Start a conversation to generate your lesson</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">{plan.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-sm mb-2">
            <span className="font-semibold text-blue-900">Goal:</span> 
            <span className="text-blue-800 ml-1">{plan.goal}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-blue-900">Objective:</span> 
            <span className="text-blue-800 ml-1">{plan.objective}</span>
          </div>
          {plan.userObjective && (
            <div className="text-sm mt-2 pt-2 border-t border-blue-200">
              <span className="font-semibold text-blue-900">Your Goal:</span> 
              <span className="text-blue-800 ml-1">{plan.userObjective}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Learning Steps</h4>
        <ul className="space-y-3">
          {plan.steps.sort((a, b) => a.order - b.order).map((s: LessonStep) => (
            <li key={s.id} className={`border rounded-lg p-4 transition-colors ${
              s.done 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm text-gray-900 flex-1">{s.conceptTitle}</h5>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 ${
                  s.done 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-gray-300'
                }`}>
                  {s.done && <span className="text-xs">✓</span>}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3">{s.description}</p>
              <div className="text-xs text-gray-700">
                <span className="font-medium">Objective:</span> {s.objective}
              </div>
              {s.userObjective && (
                <div className="text-xs text-gray-700 mt-1">
                  <span className="font-medium">Your Task:</span> {s.userObjective}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


