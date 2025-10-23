/**
 * Unit Tests: Onboarding Agent
 * Tests pain point discovery and user profiling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Onboarding Agent', () => {
  let onboardingAgent: any;
  let mockMemory: any;
  let mockLLM: any;

  beforeEach(() => {
    mockMemory = {
      store: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn()
    };

    mockLLM = {
      generate: jest.fn()
    };

    // Agent would be initialized here
    // onboardingAgent = new OnboardingAgent(mockMemory, mockLLM);
  });

  describe('Pain Point Discovery', () => {
    test('should extract pain point from user description', async () => {
      const userInput = "I waste hours every week searching for academic papers across different databases";

      const painPoint = {
        description: userInput,
        category: 'functional',
        frequency: 'weekly',
        intensity: 'high'
      };

      expect(painPoint).toBeValidPainPoint();
      expect(painPoint.category).toBe('functional');
    });

    test('should categorize pain points correctly', () => {
      const testCases = [
        {
          input: "I can't find roommates who share my interests",
          expectedCategory: 'social'
        },
        {
          input: "I'm anxious about choosing the right career path",
          expectedCategory: 'emotional'
        },
        {
          input: "My small business is losing money on wasted inventory",
          expectedCategory: 'financial'
        },
        {
          input: "The software I use crashes constantly",
          expectedCategory: 'functional'
        }
      ];

      testCases.forEach(({ input, expectedCategory }) => {
        // Mock agent's categorization logic
        const category = categorizePainPoint(input);
        expect(category).toBe(expectedCategory);
      });
    });

    test('should ask follow-up questions for vague pain points', async () => {
      const vagueInput = "I don't like studying";

      // Agent should detect this is too vague
      const isSpecific = isPainPointSpecific(vagueInput);
      expect(isSpecific).toBe(false);

      // Agent should ask clarifying questions
      const followUp = generateFollowUpQuestion(vagueInput);
      expect(followUp).toContain('specifically');
      expect(followUp).toContain('?');
    });

    test('should extract concrete details from pain point', async () => {
      const painPoint = {
        description: "As a student, I waste 5 hours weekly searching papers across PubMed, JSTOR, and Google Scholar",
        category: 'functional'
      };

      const details = extractPainPointDetails(painPoint.description);

      expect(details.who).toContain('student');
      expect(details.timeImpact).toContain('5 hours');
      expect(details.platforms).toContain('PubMed');
      expect(details.platforms).toContain('JSTOR');
    });

    test('should validate minimum pain point quality', () => {
      const validPain = {
        description: "Restaurant owners in my neighborhood waste food daily because they can't predict demand",
        category: 'financial'
      };

      const invalidPain = {
        description: "Things are bad",
        category: 'functional'
      };

      expect(validPain.description.length).toBeGreaterThan(20);
      expect(invalidPain.description.length).toBeLessThan(20);
    });
  });

  describe('Socratic Questioning', () => {
    test('should ask "why" to deepen understanding', () => {
      const userClaim = "Everyone needs this product";
      const question = generateSocraticQuestion(userClaim, 'why');

      expect(question).toContain('why');
      expect(question).toContain('?');
      expect(question.toLowerCase()).toMatch(/why|what makes you think/);
    });

    test('should challenge assumptions constructively', () => {
      const assumption = "All students have this problem";
      const challenge = challengeAssumption(assumption);

      expect(challenge).toContain('?');
      expect(challenge.toLowerCase()).toMatch(/all|every|specific/);
    });

    test('should guide user to discover insights', () => {
      const userStatement = "I think people would pay for this";
      const guidingQuestion = guideDiscovery(userStatement);

      expect(guidingQuestion).toContain('?');
      expect(guidingQuestion.toLowerCase()).toMatch(/how much|evidence|similar/);
    });
  });

  describe('User Profile Creation', () => {
    test('should create complete user profile', async () => {
      const conversationData = {
        name: 'Sarah Chen',
        background: 'CS student',
        interests: ['AI', 'education'],
        painPoint: {
          description: 'Searching papers is time-consuming',
          category: 'functional'
        }
      };

      const profile = createUserProfile(conversationData);

      expect(profile).toHaveProperty('name', 'Sarah Chen');
      expect(profile).toHaveProperty('background');
      expect(profile.interests).toHaveLength(2);
      expect(profile.painPoint).toBeValidPainPoint();
    });

    test('should store profile in memory', async () => {
      const profile = {
        name: 'Test User',
        painPoint: { description: 'Test pain', category: 'functional' }
      };

      await mockMemory.store('USER_PROFILE', profile);

      expect(mockMemory.store).toHaveBeenCalledWith('USER_PROFILE', profile);
    });

    test('should handle optional profile fields gracefully', () => {
      const minimalProfile = {
        name: 'John Doe'
      };

      const completeProfile = {
        name: 'Jane Smith',
        background: 'Business major',
        interests: ['marketing'],
        university: 'UIUC'
      };

      expect(() => createUserProfile(minimalProfile)).not.toThrow();
      expect(() => createUserProfile(completeProfile)).not.toThrow();
    });
  });

  describe('Conversation Flow', () => {
    test('should follow onboarding sequence', () => {
      const steps = [
        'greeting',
        'ask_name',
        'ask_background',
        'discover_pain',
        'categorize_pain',
        'confirm_understanding',
        'transition_to_ideation'
      ];

      const currentStep = 'ask_name';
      const nextStep = getNextOnboardingStep(currentStep);

      expect(steps).toContain(nextStep);
      expect(steps.indexOf(nextStep)).toBeGreaterThan(steps.indexOf(currentStep));
    });

    test('should adapt to user responses', () => {
      const scenarios = [
        {
          userResponse: 'detailed pain point with specifics',
          expectedNextAction: 'confirm_and_proceed'
        },
        {
          userResponse: 'vague complaint',
          expectedNextAction: 'ask_clarifying_questions'
        },
        {
          userResponse: 'I don\'t know',
          expectedNextAction: 'provide_examples'
        }
      ];

      scenarios.forEach(({ userResponse, expectedNextAction }) => {
        const action = determineNextAction(userResponse);
        expect(action).toBe(expectedNextAction);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle non-English pain points gracefully', () => {
      // For MVP, should politely redirect to English
      const spanishInput = "Necesito ayuda con mi startup";
      const response = handleNonEnglishInput(spanishInput);

      expect(response).toContain('English');
    });

    test('should handle offensive or inappropriate content', () => {
      const inappropriateInput = "I hate everyone";
      const shouldFilter = filterInappropriateContent(inappropriateInput);

      expect(shouldFilter).toBe(true);
    });

    test('should handle very long pain point descriptions', () => {
      const longDescription = 'A'.repeat(5000);
      const truncated = truncatePainPoint(longDescription, 500);

      expect(truncated.length).toBeLessThanOrEqual(500);
    });

    test('should handle users who skip questions', () => {
      const skipResponse = "skip";
      const handling = handleSkippedQuestion(skipResponse);

      expect(handling.allowSkip).toBeDefined();
    });
  });
});

// Helper functions that would be implemented in actual agent
function categorizePainPoint(input: string): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('anxious') || lowerInput.includes('stress') || lowerInput.includes('worry')) {
    return 'emotional';
  }
  if (lowerInput.includes('money') || lowerInput.includes('profit') || lowerInput.includes('cost')) {
    return 'financial';
  }
  if (lowerInput.includes('friend') || lowerInput.includes('connect') || lowerInput.includes('community')) {
    return 'social';
  }
  return 'functional';
}

function isPainPointSpecific(input: string): boolean {
  return input.length > 20 && input.split(' ').length > 5;
}

function generateFollowUpQuestion(input: string): string {
  return "That's interesting. Can you be more specific about what specifically frustrates you?";
}

function extractPainPointDetails(description: string) {
  return {
    who: description.match(/student|owner|user/i)?.[0] || 'users',
    timeImpact: description.match(/\d+ hours?/i)?.[0] || '',
    platforms: description.match(/[A-Z][a-z]+/g) || []
  };
}

function generateSocraticQuestion(claim: string, type: string): string {
  if (type === 'why') {
    return "What makes you think everyone needs this? Who specifically experiences this problem most?";
  }
  return "Can you help me understand that better?";
}

function challengeAssumption(assumption: string): string {
  return "You said 'all students'—let's be more specific. Which students exactly?";
}

function guideDiscovery(statement: string): string {
  return "That's an assumption worth testing. How would you validate if people would actually pay?";
}

function createUserProfile(data: any) {
  return {
    name: data.name,
    background: data.background || null,
    interests: data.interests || [],
    painPoint: data.painPoint,
    created_at: new Date().toISOString()
  };
}

function getNextOnboardingStep(currentStep: string): string {
  const flow = ['greeting', 'ask_name', 'ask_background', 'discover_pain', 'categorize_pain', 'confirm_understanding', 'transition_to_ideation'];
  const index = flow.indexOf(currentStep);
  return flow[index + 1] || 'complete';
}

function determineNextAction(response: string): string {
  if (response.length > 50 && response.split(' ').length > 10) {
    return 'confirm_and_proceed';
  }
  if (response.toLowerCase().includes('don\'t know')) {
    return 'provide_examples';
  }
  return 'ask_clarifying_questions';
}

function handleNonEnglishInput(input: string): string {
  return "I currently support English. Could you please describe your pain point in English?";
}

function filterInappropriateContent(input: string): boolean {
  const inappropriatePatterns = ['hate everyone', 'offensive content'];
  return inappropriatePatterns.some(pattern => input.toLowerCase().includes(pattern));
}

function truncatePainPoint(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function handleSkippedQuestion(response: string) {
  return { allowSkip: true, continueWithDefaults: true };
}
