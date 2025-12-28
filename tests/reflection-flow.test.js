/**
 * Test: Reflection Question Flow
 * Verifies that onboarding doesn't transition until user answers the reflection question
 */

import { jest } from '@jest/globals';

// Mock the database queries
const mockMemory = {};
const mockSetMemory = jest.fn((sessionId, key, value) => {
  mockMemory[key] = value;
});
const mockGetMemory = jest.fn((sessionId, key) => mockMemory[key]);

describe('Onboarding Reflection Flow', () => {
  beforeEach(() => {
    // Reset memory before each test
    Object.keys(mockMemory).forEach(key => delete mockMemory[key]);
  });

  test('should NOT complete when reflection asked but not received', async () => {
    // Simulate state after user provides pain point details
    mockMemory.USER_PROFILE = { name: 'Vishal' };
    mockMemory.USER_PAIN = {
      description: "cant find things to wear",
      frequency: 'daily',
      severity: 6,
      affectsOthers: true,
      reflectionAsked: true,  // Bot asked reflection question
      reflectionReceived: false  // User hasn't answered yet
    };

    const { OnboardingAgent } = await import('../src/agents/onboarding.js');
    const agent = new OnboardingAgent();

    // Mock the memory methods
    agent.getMemory = mockGetMemory;

    const isComplete = await agent.isComplete('test-session');

    expect(isComplete).toBe(false);
    console.log('✓ Agent correctly waits for reflection response');
  });

  test('should complete when reflection is received', async () => {
    mockMemory.USER_PROFILE = { name: 'Vishal' };
    mockMemory.USER_PAIN = {
      description: "cant find things to wear",
      frequency: 'daily',
      severity: 6,
      affectsOthers: true,
      reflectionAsked: true,
      reflectionReceived: true  // User has answered
    };

    const { OnboardingAgent } = await import('../src/agents/onboarding.js');
    const agent = new OnboardingAgent();
    agent.getMemory = mockGetMemory;

    const isComplete = await agent.isComplete('test-session');

    expect(isComplete).toBe(true);
    console.log('✓ Agent correctly completes after reflection response');
  });

  test('calculateDepthScore should return correct score', async () => {
    const { OnboardingAgent } = await import('../src/agents/onboarding.js');
    const agent = new OnboardingAgent();

    const painWithAllIndicators = {
      frequency: 'daily',
      severity: 6,
      affectsOthers: true,
      currentSolution: 'nothing',
      willingnessSignal: true
    };

    const score = agent.calculateDepthScore(painWithAllIndicators);
    expect(score).toBe(5);
    console.log('✓ Depth score calculated correctly:', score);
  });
});

// Manual test simulation
console.log(`
=== MANUAL TEST STEPS ===

1. Start fresh session
2. Send: "vishal" (name)
3. Send: "cant find things to wear" (pain)
4. Send: "daily" (frequency)
5. Send: "6" (severity)
6. Send: "a lot of my friends say the same" (scope)

EXPECTED: Bot asks "What's the REAL reason this bothers you?"
EXPECTED: Bot does NOT immediately ask about solutions

7. Send: "I feel unprepared and it affects my confidence"

EXPECTED: NOW bot transitions to idea generator
`);
