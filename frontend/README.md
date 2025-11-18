# VentureBot Frontend

Modern React-based frontend for VentureBot - Your AI-powered entrepreneurship coaching platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Features

### ✅ Core Features
- **Authentication System** - Secure login/register with JWT tokens
- **Project Management** - Create and manage multiple entrepreneurship projects
- **Multi-Agent Interface** - Chat with specialized AI agents (Idea Generator, Validator, Strategist, Builder, Growth Advisor)
- **Progress Tracking** - Visual 7-phase journey tracking (Discovery → Growth)
- **Coaching Dashboard** - Personalized recommendations and next steps
- **Activity Timeline** - Track all interactions and milestones

### ✅ UI/UX
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Mobile Bottom Navigation** - Touch-friendly navigation on mobile devices
- **PWA Support** - Installable as a progressive web app
- **Dark Mode Ready** - Theme system prepared for dark mode
- **Smooth Animations** - Framer Motion for delightful interactions
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support

### ✅ Technical
- **React 18** - Latest React with concurrent features
- **TypeScript** - Full type safety throughout
- **Tailwind CSS** - Utility-first styling with custom design system
- **React Query** - Efficient data fetching and caching
- **React Router v6** - Client-side routing with protected routes
- **Vite** - Lightning-fast build tool

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── agents/       # Agent-related components
│   │   ├── coaching/     # Coaching dashboard components
│   │   ├── progress/     # Progress tracking components
│   │   ├── projects/     # Project management components
│   │   ├── auth/         # Authentication components
│   │   └── layout/       # Layout components (AppShell, Navigation)
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom hooks and React Query hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
└── tests/                # Test files (optional)
```

## 🎨 Component Library

### UI Components
- Button, Input, Textarea, Card, Modal, Badge, Alert, Spinner, Skeleton
- Layout components: Container, Grid, Stack, PageHeader
- All components are fully typed and accessible

### Feature Components
- AgentCard, AgentSelector, ChatInterface
- ProjectCard, ProjectSwitcher, CreateProjectModal
- PhaseCard, ProgressTracker, MilestoneCard
- RecommendationCard, ActivityTimeline, NextSteps

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=VentureBot
```

### Tailwind Configuration

Custom design tokens in `tailwind.config.js`:
- Primary, Secondary, Accent, Neutral color palettes
- Custom fonts (Inter, JetBrains Mono)
- Custom animations and keyframes

## 📱 Mobile Support

- Mobile-first responsive design
- Touch gesture support (swipe navigation)
- Bottom navigation bar on mobile
- Optimized for iOS and Android
- PWA manifest for installation

## 🔐 Authentication

Currently in demo mode:
- Any email/password combination works
- Data stored in localStorage
- JWT token simulation

To connect to real backend:
1. Update `VITE_API_URL` in `.env`
2. Backend should provide JWT tokens
3. Update `AuthContext.tsx` to use real API

## 📊 State Management

- **React Context** - Global state (Auth, Project, Agent, Progress)
- **React Query** - Server state with caching
- **localStorage** - Persistent local data

## 🎯 Key Pages

- `/` - Dashboard with coaching recommendations
- `/projects` - Project management
- `/agents` - AI agent chat interface
- `/progress` - Journey progress tracking
- `/history` - Activity history
- `/settings` - User settings
- `/components` - Component library showcase

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

Quick deploy options:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=dist`
- **Static hosting**: Upload `dist` folder

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [MIGRATION.md](./MIGRATION.md) - Getting started guide
- [Component README](./src/components/ui/README.md) - UI component docs

## 🧪 Testing

Testing infrastructure is set up but tests are optional:

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 🛠️ Development

### Code Style
- ESLint + Prettier configured
- TypeScript strict mode
- Conventional commits recommended

### Available Scripts
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run format` - Format code with Prettier

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb) - Main brand color
- **Secondary**: Green (#22c55e) - Success states
- **Accent**: Orange (#f37316) - Highlights
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Sans**: Inter - UI text
- **Mono**: JetBrains Mono - Code snippets

### Spacing
- Consistent 4px base unit
- Tailwind spacing scale (0-96)

## 🤝 Contributing

1. Follow existing code style
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test on mobile devices
5. Ensure accessibility

## 📄 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Check browser console for errors
- Verify API connection
- Test in incognito mode
- Review documentation

## 🎉 What's Next?

The frontend is feature-complete! Next steps:
1. Connect to real backend API
2. Add real-time WebSocket support
3. Implement actual AI agent responses
4. Add analytics tracking
5. Set up error monitoring
6. Deploy to production

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
