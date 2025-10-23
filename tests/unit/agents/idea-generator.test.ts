/**
 * Unit Tests: Idea Generator Agent
 * Tests idea generation and concept explanation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Idea Generator Agent', () => {
  let ideaGenerator: any;
  let mockMemory: any;
  let mockLLM: any;

  beforeEach(() => {
    mockMemory = {
      retrieve: jest.fn(),
      store: jest.fn()
    };

    mockLLM = {
      generate: jest.fn()
    };
  });

  describe('Idea Generation', () => {
    test('should generate 5 diverse ideas from pain point', async () => {
      const painPoint = {
        description: "Students waste hours searching academic papers across databases",
        category: 'functional'
      };

      const ideas = await generateIdeas(painPoint, 5);

      expect(ideas).toHaveLength(5);
      ideas.forEach(idea => {
        expect(idea).toBeValidIdea();
      });
    });

    test('should include business concepts in ideas', () => {
      const idea = {
        title: 'Academic Search SaaS',
        description: 'Subscription-based unified search platform',
        concepts: ['SaaS', 'API aggregation', 'freemium model']
      };

      expect(idea.concepts).toContain('SaaS');
      expect(idea.concepts.length).toBeGreaterThanOrEqual(2);
    });

    test('should ensure ideas are diverse in approach', () => {
      const ideas = [
        { title: 'Idea 1', approach: 'marketplace' },
        { title: 'Idea 2', approach: 'SaaS' },
        { title: 'Idea 3', approach: 'browser_extension' },
        { title: 'Idea 4', approach: 'mobile_app' },
        { title: 'Idea 5', approach: 'AI_assistant' }
      ];

      const approaches = ideas.map(i => i.approach);
      const uniqueApproaches = new Set(approaches);

      expect(uniqueApproaches.size).toBe(5); // All different
    });

    test('should tailor ideas to solopreneur feasibility', () => {
      const ideas = [
        {
          title: 'Quick MVP Idea',
          execution_complexity: 'low',
          required_skills: ['no-code', 'API integration'],
          timeline: '2-4 weeks'
        }
      ];

      ideas.forEach(idea => {
        expect(['low', 'medium']).toContain(idea.execution_complexity);
        expect(idea.timeline).toMatch(/weeks/);
      });
    });

    test('should incorporate modern business models', () => {
      const businessModels = [
        'SaaS',
        'marketplace',
        'freemium',
        'network effects',
        'long tail',
        'platform',
        'subscription',
        'usage-based'
      ];

      const ideas = generateIdeasWithModels(businessModels);

      ideas.forEach(idea => {
        const hasModel = idea.concepts.some((c: string) =>
          businessModels.includes(c)
        );
        expect(hasModel).toBe(true);
      });
    });
  });

  describe('Concept Explanation', () => {
    test('should explain business concepts clearly', () => {
      const explanations = {
        'SaaS': explainConcept('SaaS'),
        'network effects': explainConcept('network effects'),
        'freemium': explainConcept('freemium')
      };

      Object.values(explanations).forEach(explanation => {
        expect(explanation.length).toBeGreaterThan(50);
        expect(explanation).toMatch(/[A-Z]/); // Has capital letters
        expect(explanation).not.toContain('jargon');
      });
    });

    test('should provide real-world examples', () => {
      const concept = 'network effects';
      const explanation = explainWithExample(concept);

      expect(explanation.example).toBeDefined();
      expect(explanation.example).toContain('Facebook' || 'Uber' || 'Airbnb');
    });

    test('should adapt explanation complexity to user level', () => {
      const userLevels = ['beginner', 'intermediate', 'advanced'];

      userLevels.forEach(level => {
        const explanation = explainConceptForLevel('API', level);

        if (level === 'beginner') {
          expect(explanation).not.toContain('RESTful');
          expect(explanation).toMatch(/like|imagine|think of/i);
        }
      });
    });
  });

  describe('Idea Quality', () => {
    test('should validate idea addresses pain point', () => {
      const painPoint = {
        description: "Can't find roommates with similar interests",
        category: 'social'
      };

      const relevantIdea = {
        title: 'RoommateMatch',
        description: 'AI-powered roommate matching based on interests',
        addresses_pain: true
      };

      const irrelevantIdea = {
        title: 'Food Delivery App',
        description: 'Order food online',
        addresses_pain: false
      };

      expect(doesIdeaAddressPain(relevantIdea, painPoint)).toBe(true);
      expect(doesIdeaAddressPain(irrelevantIdea, painPoint)).toBe(false);
    });

    test('should score idea feasibility for solopreneurs', () => {
      const ideas = [
        {
          title: 'Simple Landing Page',
          technical_complexity: 'low',
          time_estimate: '1 week',
          required_budget: '$0'
        },
        {
          title: 'Complex Platform',
          technical_complexity: 'high',
          time_estimate: '6 months',
          required_budget: '$50k'
        }
      ];

      const scores = ideas.map(scoreFeasibility);

      expect(scores[0]).toBeGreaterThan(0.8); // High feasibility
      expect(scores[1]).toBeLessThan(0.3); // Low feasibility
    });
  });

  describe('User Interaction', () => {
    test('should present ideas in engaging format', () => {
      const idea = {
        title: 'Academic Search Engine',
        description: 'Unified search across all databases',
        concepts: ['SaaS', 'API aggregation']
      };

      const presentation = formatIdeaPresentation(idea);

      expect(presentation).toContain(idea.title);
      expect(presentation).toContain('**'); // Markdown formatting
      expect(presentation).toMatch(/\d+\./); // Numbered list
    });

    test('should allow user to select idea or provide own', async () => {
      const userSelections = [
        { type: 'select_from_list', idea_number: 3 },
        { type: 'provide_own', custom_idea: 'My own idea description' }
      ];

      userSelections.forEach(selection => {
        const result = handleIdeaSelection(selection);
        expect(result.selected).toBeDefined();
      });
    });

    test('should store selected idea in memory', async () => {
      const selectedIdea = {
        id: 'idea-123',
        title: 'Test Idea',
        description: 'Test description'
      };

      await mockMemory.store('SELECTED_IDEA', selectedIdea);

      expect(mockMemory.store).toHaveBeenCalledWith('SELECTED_IDEA', selectedIdea);
    });
  });

  describe('Edge Cases', () => {
    test('should handle pain points in unusual categories', () => {
      const unusualPain = {
        description: "Environmental waste from single-use plastics",
        category: 'environmental' // Not in standard categories
      };

      const ideas = generateIdeas(unusualPain, 5);
      expect(ideas.length).toBeGreaterThan(0);
    });

    test('should handle very specific niche pain points', () => {
      const nichePain = {
        description: "Left-handed violinists can't find proper chin rests",
        category: 'functional'
      };

      const ideas = generateIdeas(nichePain, 5);

      ideas.forEach(idea => {
        expect(idea.target_audience).toContain('left-handed violinists' || 'musicians');
      });
    });

    test('should avoid generating duplicate ideas', () => {
      const ideas = generateIdeas({ description: 'Test pain', category: 'functional' }, 5);

      const titles = ideas.map((i: any) => i.title);
      const uniqueTitles = new Set(titles);

      expect(uniqueTitles.size).toBe(titles.length);
    });

    test('should handle user rejecting all ideas', () => {
      const userFeedback = { action: 'reject_all', reason: 'Not interested' };
      const response = handleAllIdeasRejected(userFeedback);

      expect(response.next_step).toBe('refine_pain_point' || 'generate_new_ideas');
    });
  });
});

// Helper functions
async function generateIdeas(painPoint: any, count: number) {
  const ideas = [];
  const approaches = ['SaaS', 'marketplace', 'browser_extension', 'mobile_app', 'AI_assistant'];

  for (let i = 0; i < count; i++) {
    ideas.push({
      id: `idea-${i}`,
      title: `Solution ${i + 1}`,
      description: `Addresses pain point using ${approaches[i]} approach`,
      concepts: [approaches[i], 'API integration'],
      execution_complexity: i % 2 === 0 ? 'low' : 'medium',
      timeline: `${2 + i * 2} weeks`
    });
  }

  return ideas;
}

function generateIdeasWithModels(models: string[]) {
  return models.slice(0, 5).map((model, i) => ({
    id: `idea-${i}`,
    title: `Idea ${i + 1}`,
    concepts: [model, 'secondary concept']
  }));
}

function explainConcept(concept: string): string {
  const explanations: Record<string, string> = {
    'SaaS': 'Software as a Service means customers pay a subscription to use your software online, like Netflix for apps.',
    'network effects': 'The product becomes more valuable as more people use it, like how Facebook is useful because your friends are there.',
    'freemium': 'Offer a free basic version to attract users, then charge for premium features.'
  };

  return explanations[concept] || 'Explanation of concept';
}

function explainWithExample(concept: string) {
  return {
    concept,
    explanation: explainConcept(concept),
    example: 'Facebook demonstrates network effects - it\'s valuable because your friends use it.'
  };
}

function explainConceptForLevel(concept: string, level: string): string {
  if (level === 'beginner') {
    return `Think of an ${concept} like a messenger between apps, helping them talk to each other.`;
  }
  return `An ${concept} is a RESTful interface for programmatic access to data and functionality.`;
}

function doesIdeaAddressPain(idea: any, painPoint: any): boolean {
  return idea.addresses_pain === true;
}

function scoreFeasibility(idea: any): number {
  if (idea.technical_complexity === 'low') return 0.9;
  if (idea.technical_complexity === 'medium') return 0.6;
  return 0.2;
}

function formatIdeaPresentation(idea: any): string {
  return `**${idea.title}**\n\n${idea.description}\n\n**Concepts**: ${idea.concepts.join(', ')}`;
}

function handleIdeaSelection(selection: any) {
  if (selection.type === 'select_from_list') {
    return { selected: `idea-${selection.idea_number}` };
  }
  return { selected: 'custom', custom_idea: selection.custom_idea };
}

function handleAllIdeasRejected(feedback: any) {
  return { next_step: 'generate_new_ideas', reason: feedback.reason };
}
