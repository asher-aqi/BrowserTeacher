export type LessonStep = {
  id: string;
  conceptTitle: string; // the concept to learn in this step
  description: string;  // what this step covers
  objective: string;    // outcome the agent should achieve
  userObjective?: string; // optional user action/outcome
  done: boolean;
  order: number;
};

export type LessonPlan = {
  title: string;
  description: string;
  goal: string;
  objective: string;
  userObjective?: string;
  steps: LessonStep[];
};

export type Session = {
  id: string;
  roomId: string;
  bbSessionId: string;
  bbLiveViewUrl: string;
  bbDevtoolsWssUrl: string;
  status: "active" | "ended" | "error";
  createdAt: number;
};


