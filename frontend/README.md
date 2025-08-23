# BrowserTeacher Frontend

A modern, interactive web development learning platform built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS
- **App Router**: Uses the latest Next.js App Router for modern routing
- **Type Safety**: Full TypeScript support for better development experience
- **Responsive Design**: Mobile-first design with Tailwind CSS utilities
- **Component Library**: Reusable UI components with consistent design patterns
- **Dark Mode Support**: Built-in dark mode with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom component library
- **Package Manager**: npm
- **Linting**: ESLint with Next.js configuration

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   ├── lessons/           # Lessons route
│   │   └── page.tsx       # Lessons page
│   └── about/             # About route
│       └── page.tsx       # About page
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
│       └── Button.tsx    # Button component
├── lib/                   # Utility libraries
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript type definitions
│   └── index.ts          # Common interfaces
├── hooks/                 # Custom React hooks
└── utils/                 # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Component Usage

### Button Component

```tsx
import Button from '@/components/ui/Button';

// Primary button
<Button>Click me</Button>

// Secondary button
<Button variant="secondary">Secondary</Button>

// Outline button
<Button variant="outline">Outline</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## 🌙 Dark Mode

The application automatically supports dark mode using Tailwind CSS. The theme will follow the user's system preference.

## 📱 Responsive Design

The application is built with a mobile-first approach using Tailwind CSS responsive utilities:

- `sm:` - Small devices (640px+)
- `md:` - Medium devices (768px+)
- `lg:` - Large devices (1024px+)
- `xl:` - Extra large devices (1280px+)

## 🔧 Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration

## 🚀 Deployment

The application can be deployed to various platforms:

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Static site deployment
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Ensure components are responsive and accessible
4. Add proper TypeScript types for new features
5. Test your changes thoroughly

## 📄 License

This project is part of the BrowserTeacher platform.

## 🆘 Support

For questions or issues, please refer to the project documentation or create an issue in the repository.
