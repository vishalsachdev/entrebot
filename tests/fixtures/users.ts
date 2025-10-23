/**
 * Test Fixtures: User Profiles
 * Realistic user data for testing
 */

export const mockUsers = {
  newStudent: {
    id: 'user-001',
    email: 'sarah@illinois.edu',
    name: 'Sarah Chen',
    background: 'Computer Science student',
    interests: ['AI', 'education', 'productivity'],
    created_at: '2025-01-15T10:00:00Z',
    university: 'University of Illinois'
  },

  experiencedFounder: {
    id: 'user-002',
    email: 'alex@gmail.com',
    name: 'Alex Johnson',
    background: 'Former PM at tech startup',
    interests: ['fintech', 'automation', 'SaaS'],
    created_at: '2025-01-10T08:30:00Z',
    previous_startups: 1
  },

  nonTechnical: {
    id: 'user-003',
    email: 'maria@illinois.edu',
    name: 'Maria Rodriguez',
    background: 'Business major',
    interests: ['marketing', 'social impact', 'healthcare'],
    created_at: '2025-01-18T14:20:00Z',
    technical_skills: 'beginner'
  }
};

export const mockPainPoints = {
  functionalPain: {
    description: "As a student, I waste hours every week searching for relevant academic papers across different databases. It's frustrating to not have a single search interface.",
    category: 'functional',
    frequency: 'daily',
    intensity: 'high',
    affected_users: 'university students and researchers'
  },

  socialPain: {
    description: "International students at my university struggle to make friends because there's no platform connecting them with local students who share similar interests.",
    category: 'social',
    frequency: 'constant',
    intensity: 'medium',
    affected_users: 'international students'
  },

  emotionalPain: {
    description: "I feel anxious about choosing a career path because I don't have access to mentors who can provide honest guidance about different industries.",
    category: 'emotional',
    frequency: 'weekly',
    intensity: 'high',
    affected_users: 'college students facing career decisions'
  },

  financialPain: {
    description: "Small restaurant owners in my neighborhood waste food daily because they can't predict demand accurately. It's cutting into their already thin profit margins.",
    category: 'financial',
    frequency: 'daily',
    intensity: 'high',
    affected_users: 'small restaurant owners'
  }
};

export const mockProfiles = {
  withPainPoint: {
    ...mockUsers.newStudent,
    pain_point: mockPainPoints.functionalPain
  },

  withMultipleProjects: {
    ...mockUsers.experiencedFounder,
    projects: [
      { id: 'proj-001', status: 'launched', name: 'First Startup' },
      { id: 'proj-002', status: 'building', name: 'Second Idea' }
    ]
  }
};
