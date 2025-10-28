# VentureBot Frontend

Modern React-based frontend for the VentureBot AI-powered entrepreneurship coaching platform.

## Tech Stack

- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling with custom design tokens
- **React Router v6** for client-side routing
- **React Query (TanStack Query)** for server state management
- **Framer Motion** for smooth animations and transitions
- **Headless UI** for accessible, unstyled components
- **Lucide React** for consistent iconography

## Development Tools

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **lint-staged** for pre-commit checks

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API services and utilities
├── types/          # TypeScript type definitions
└── utils/          # Utility functions and constants
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Features

### Multi-Agent Interface
- Seamless switching between different AI agents
- Agent specialization and availability indicators
- Real-time conversation streaming
- Agent handoff notifications

### Progress Tracking
- Visual journey phase timeline
- Milestone tracking and achievements
- Progress persistence across sessions
- Contextual recommendations

### Project Management
- Multiple project support
- Project switching with context preservation
- Project overview and analytics
- Project lifecycle management

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Progressive Web App features
- Offline mode support

## Design System

The application uses a custom design system built with Tailwind CSS:

### Colors
- **Primary**: Blue tones for main actions and branding
- **Secondary**: Green tones for success states and progress
- **Accent**: Orange tones for highlights and warnings
- **Neutral**: Gray tones for text and backgrounds

### Components
- Consistent button styles with variants (primary, secondary, ghost)
- Form inputs with focus states and validation
- Cards with subtle shadows and borders
- Badges for status indicators

### Typography
- **Inter** for body text and UI elements
- **JetBrains Mono** for code and technical content

## API Integration

The frontend communicates with the backend API through:
- RESTful endpoints for CRUD operations
- WebSocket connections for real-time messaging
- React Query for caching and synchronization
- Automatic token management and refresh

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write TypeScript with strict type checking
3. Use semantic commit messages
4. Ensure all tests pass before submitting PRs
5. Update documentation for new features

## Environment Variables

- `VITE_API_URL` - Backend API base URL
- `VITE_WS_URL` - WebSocket server URL
- `VITE_NODE_ENV` - Environment (development/production)
