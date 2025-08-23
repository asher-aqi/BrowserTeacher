# BrowserTeacher

An interactive web development learning platform that helps developers master browser technologies through hands-on practice and real-time feedback.

## 🚀 Features

- **Interactive Learning**: Learn by doing with hands-on exercises and real-time feedback
- **Modern Technologies**: Master the latest web standards, frameworks, and best practices
- **Personalized Progress**: Track your learning journey with detailed progress analytics
- **Community Support**: Join a community of learners and developers

## 🏗️ Project Structure

```
BrowserTeacher/
├── backend/                 # Python FastAPI backend
│   ├── api/                # API endpoints and business logic
│   ├── core/               # Core configuration and utilities
│   ├── main.py             # FastAPI application entry point
│   └── pyproject.toml      # Python dependencies and project config
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # Utility functions and libraries
│   │   ├── types/          # TypeScript type definitions
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper utilities
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── README.md               # This file
```

## 🛠️ Tech Stack

### Backend
- **Python 3.11+** - Core programming language
- **FastAPI** - Modern, fast web framework
- **UV** - Fast Python package manager
- **E2B** - Sandboxed code execution environment

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- UV package manager

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Run the development server:
   ```bash
   uv run python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## 📚 Available Routes

### Frontend Routes
- `/` - Home page with project overview
- `/lessons` - Browse available lessons
- `/about` - About page with project information

### Backend API
- `/docs` - Interactive API documentation (Swagger UI)
- `/health` - Health check endpoint

## 🔧 Development

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black code formatter, isort for imports

### Type Safety
- **Frontend**: Full TypeScript support
- **Backend**: Type hints and mypy support

### Testing
- **Frontend**: Jest + React Testing Library
- **Backend**: pytest for Python testing

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you have any questions or need help, please open an issue on GitHub or reach out to the development team.
