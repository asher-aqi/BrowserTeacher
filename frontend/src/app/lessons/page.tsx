import Link from 'next/link';
import Button from '@/components/ui/Button';

const lessons = [
  {
    id: '1',
    title: 'Introduction to HTML',
    description: 'Learn the basics of HTML markup and document structure',
    difficulty: 'beginner' as const,
    duration: 15,
    tags: ['HTML', 'Basics', 'Structure'],
    completed: false
  },
  {
    id: '2',
    title: 'CSS Fundamentals',
    description: 'Master CSS styling, selectors, and layout techniques',
    difficulty: 'beginner' as const,
    duration: 20,
    tags: ['CSS', 'Styling', 'Layout'],
    completed: false
  },
  {
    id: '3',
    title: 'JavaScript Basics',
    description: 'Start your journey with JavaScript programming',
    difficulty: 'beginner' as const,
    duration: 25,
    tags: ['JavaScript', 'Programming', 'Basics'],
    completed: false
  }
];

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Available Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose a lesson to start learning web development
          </p>
        </div>

        {/* Lessons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : lesson.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {lesson.difficulty}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {lesson.duration} min
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {lesson.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {lesson.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {lesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <Button className="w-full">
                Start Lesson
              </Button>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
