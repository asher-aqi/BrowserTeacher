import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About BrowserTeacher
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Empowering developers to master web technologies through interactive, hands-on learning
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            BrowserTeacher was created with a simple goal: to make web development learning accessible, 
            engaging, and effective. We believe that the best way to learn is by doing, which is why 
            our platform focuses on interactive lessons, real-world examples, and hands-on practice.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Interactive Learning
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our lessons include interactive code editors, real-time feedback, and hands-on exercises 
              that help you understand concepts deeply.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Modern Curriculum
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Stay up-to-date with the latest web technologies, frameworks, and best practices 
              used in modern web development.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Personalized Progress
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track your learning journey with detailed progress analytics and personalized 
              recommendations based on your performance.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Community Support
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Join a community of learners and developers, share your progress, and get help 
              when you need it.
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Built with Modern Technologies
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Next.js 15</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">React Framework</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">TypeScript</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Type Safety</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tailwind CSS</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utility-First CSS</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">App Router</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Modern Routing</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Learning?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lessons">
              <Button size="lg">
                Browse Lessons
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
