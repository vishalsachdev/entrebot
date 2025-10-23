/**
 * Test Fixtures: Conversation Data
 * Sample conversations for testing agent interactions
 */

export const mockConversations = {
  onboardingComplete: {
    id: 'conv-001',
    user_id: 'user-001',
    agent_type: 'onboarding',
    status: 'completed',
    messages: [
      {
        role: 'assistant',
        content: "Hi! I'm VentureBot, your AI entrepreneurship coach. What's your name?",
        timestamp: '2025-01-15T10:00:00Z'
      },
      {
        role: 'user',
        content: 'Sarah Chen',
        timestamp: '2025-01-15T10:00:15Z'
      },
      {
        role: 'assistant',
        content: "Great to meet you, Sarah! Let's discover problems worth solving. Think about your daily life—what frustrates you most?",
        timestamp: '2025-01-15T10:00:20Z'
      },
      {
        role: 'user',
        content: "I waste so much time searching for academic papers across different databases. There's no unified search.",
        timestamp: '2025-01-15T10:02:30Z'
      },
      {
        role: 'assistant',
        content: "That's a concrete pain point! Let's dig deeper. How often do you experience this frustration?",
        timestamp: '2025-01-15T10:02:35Z'
      },
      {
        role: 'user',
        content: 'Multiple times per week, especially during research projects',
        timestamp: '2025-01-15T10:03:00Z'
      }
    ],
    metadata: {
      pain_point_identified: true,
      pain_category: 'functional'
    },
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:03:05Z'
  },

  ideationInProgress: {
    id: 'conv-002',
    user_id: 'user-001',
    agent_type: 'idea_generator',
    status: 'active',
    messages: [
      {
        role: 'assistant',
        content: "Based on your pain point about academic paper search, here are 5 solution concepts...",
        timestamp: '2025-01-15T10:05:00Z',
        ideas: [
          {
            id: 'idea-001',
            title: 'UniSearch - Federated Academic Search Engine',
            description: 'AI-powered search engine that queries multiple academic databases simultaneously',
            concepts: ['API aggregation', 'semantic search', 'SaaS']
          },
          {
            id: 'idea-002',
            title: 'PaperTrail - Research Assistant',
            description: 'Browser extension that suggests relevant papers based on what you\'re reading',
            concepts: ['browser extension', 'ML recommendations', 'freemium']
          }
        ]
      }
    ],
    created_at: '2025-01-15T10:05:00Z',
    updated_at: '2025-01-15T10:05:00Z'
  },

  validationComplete: {
    id: 'conv-003',
    user_id: 'user-001',
    agent_type: 'market_validator',
    status: 'completed',
    messages: [
      {
        role: 'assistant',
        content: "I've analyzed the market for UniSearch. Here's the validation dashboard...",
        timestamp: '2025-01-15T10:10:00Z',
        validation_results: {
          overall_score: 0.72,
          scores: {
            market_opportunity: 0.80,
            competitive_landscape: 0.65,
            execution_feasibility: 0.78,
            innovation_potential: 0.65
          },
          confidence: 0.85,
          recommendation: 'proceed',
          insights: [
            'Large addressable market of 20M+ students',
            '15 competitors identified, mostly enterprise-focused',
            'Feasible with current no-code tools',
            'Moderate innovation, clear value proposition'
          ]
        }
      }
    ],
    created_at: '2025-01-15T10:10:00Z',
    updated_at: '2025-01-15T10:10:30Z'
  }
};

export const mockMessages = {
  socraticQuestion: {
    role: 'assistant',
    content: "That's interesting. But why do you think students would pay for this instead of using Google Scholar for free?",
    agent_type: 'mentor',
    coaching_pattern: 'socratic_questioning'
  },

  challengeAssumption: {
    role: 'assistant',
    content: "You mentioned 'everyone' needs this. Let's be more specific—who exactly experiences this pain most intensely?",
    agent_type: 'mentor',
    coaching_pattern: 'assumption_challenge'
  },

  celebration: {
    role: 'assistant',
    content: "🎉 Excellent insight! You've identified a clear market gap. That's exactly the kind of thinking that leads to successful products.",
    agent_type: 'mentor',
    coaching_pattern: 'celebration'
  }
};
