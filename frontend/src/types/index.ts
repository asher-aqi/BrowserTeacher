export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  tags: string[];
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    currentLesson?: string;
  };
}

export interface LessonContent {
  id: string;
  lessonId: string;
  type: 'text' | 'code' | 'interactive' | 'quiz';
  content: string;
  order: number;
}
