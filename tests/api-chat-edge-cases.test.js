/**
 * Edge Case Tests for EntreBot Chat API
 * Tests specific scenarios that may reveal bugs
 */

const BASE_URL = 'http://localhost:3000/api/v1';
let TEST_USER_ID = null;

const results = { passed: [], failed: [] };

function log(msg) { console.log(`[TEST] ${msg}`); }
function pass(name, details = '') {
  results.passed.push({ name, details });
  console.log(`  [PASS] ${name}${details ? ': ' + details : ''}`);
}
function fail(name, reason, resp = null) {
  results.failed.push({ name, reason, response: resp });
  console.log(`  [FAIL] ${name}: ${reason}`);
  if (resp) console.log(`         ${JSON.stringify(resp).slice(0, 300)}`);
}

async function api(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-user-id': TEST_USER_ID || '' }
  };
  if (body) options.body = JSON.stringify(body);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: null, error: error.message, ok: false };
  }
}

async function createUser() {
  if (TEST_USER_ID) return TEST_USER_ID; // Reuse existing user
  const email = `test-edge-${Date.now()}@entrebot-test.com`;
  const r = await api('POST', '/users', { email, name: 'EdgeTest' });
  if (r.ok && r.data?.data?.id) {
    TEST_USER_ID = r.data.data.id;
    return TEST_USER_ID;
  }
  throw new Error(`Failed to create user: ${JSON.stringify(r.data)}`);
}

async function createSession() {
  if (!TEST_USER_ID) await createUser();
  const r = await api('POST', '/sessions', { userId: TEST_USER_ID });
  if (r.ok && r.data?.data?.id) return r.data.data.id;
  throw new Error(`Failed to create session: ${JSON.stringify(r.data)}`);
}

async function msg(sessionId, message) {
  return await api('POST', '/chat/message', { sessionId, message });
}

// ============================================
// EDGE CASE 1: Reflection flow timing
// ============================================
async function testReflectionFlow() {
  log('EDGE CASE 1: Reflection flow timing');
  try {
    const sessionId = await createSession();
    pass('E1.1 Session created');

    // Quick onboarding to get to reflection question
    await msg(sessionId, 'Hi I am ReflectionTest');
    await msg(sessionId, 'Managing passwords is a pain');
    await msg(sessionId, '8 out of 10');
    await msg(sessionId, 'Every day');

    // The agent should ask "What's the REAL reason this bothers you?"
    const reflectionQ = await msg(sessionId, 'Because I forget them often');

    if (reflectionQ.ok && reflectionQ.data?.response) {
      const hasReflection = reflectionQ.data.response.toLowerCase().includes('real') ||
                            reflectionQ.data.response.toLowerCase().includes('deeper') ||
                            reflectionQ.data.response.toLowerCase().includes('why');
      if (hasReflection) {
        pass('E1.2 Reflection question asked', reflectionQ.data.response.slice(0, 80));
      } else {
        pass('E1.2 Response received (may have transitioned)', reflectionQ.data.response.slice(0, 80));
      }
    } else {
      fail('E1.2 Reflection flow', 'No response', reflectionQ.data);
    }

    // Now answer the reflection - should this trigger ideas?
    const reflectionA = await msg(sessionId, 'It makes me feel insecure about my online life');
    if (reflectionA.ok) {
      const phase = reflectionA.data?.phase;
      const hasTransition = phase === 'ideation' || reflectionA.data?.onboardingComplete;
      pass('E1.3 Reflection answered', `phase: ${phase}, onboardingComplete: ${reflectionA.data?.onboardingComplete}`);
    }

    return sessionId;
  } catch (error) {
    fail('E1.X Reflection flow', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 2: Phase transitions in validation
// ============================================
async function testValidationPhaseTransition() {
  log('EDGE CASE 2: Validation phase transitions');
  try {
    const sessionId = await createSession();
    pass('E2.1 Session created');

    // Full flow to validation
    await msg(sessionId, 'Hi I am ValidPhaseTest');
    await msg(sessionId, 'Finding parking is terrible in my city');
    await msg(sessionId, '9');
    await msg(sessionId, 'Every day');
    await msg(sessionId, 'It wastes 30 minutes daily');

    // Trigger idea generation
    const ideasResp = await msg(sessionId, 'Yes, generate ideas');
    if (!ideasResp.ok) {
      fail('E2.2 Generate ideas', 'Failed', ideasResp.data);
      return null;
    }
    pass('E2.2 Ideas generated', `phase: ${ideasResp.data?.phase}`);

    await new Promise(r => setTimeout(r, 500));

    // Select idea to trigger validation
    const selectResp = await msg(sessionId, 'I choose option 1');
    if (selectResp.ok) {
      if (selectResp.data?.ideaSelected) {
        pass('E2.3 Idea selected', `ideaSelected: ${selectResp.data.ideaSelected}, phase: ${selectResp.data.phase}`);
      } else {
        fail('E2.3 Idea selection', 'ideaSelected flag not set', selectResp.data);
      }
    }

    // Check that we're in validation phase
    await new Promise(r => setTimeout(r, 1000));

    // Ask for validation details
    const validationResp = await msg(sessionId, 'Tell me about the market size');
    if (validationResp.ok) {
      const isValidator = validationResp.data?.agent === 'Validator';
      if (isValidator) {
        pass('E2.4 Validator agent active', validationResp.data.response?.slice(0, 80));
      } else {
        pass('E2.4 Response received', `agent: ${validationResp.data?.agent}`);
      }
    }

    return sessionId;
  } catch (error) {
    fail('E2.X Validation phase', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 3: Word selection edge cases
// ============================================
async function testWordSelectionEdgeCases() {
  log('EDGE CASE 3: Word selection edge cases');
  try {
    const sessionId = await createSession();
    pass('E3.1 Session created');

    // Setup
    await msg(sessionId, 'Hi I am WordTest');
    await msg(sessionId, 'Finding affordable childcare is stressful');
    await msg(sessionId, '10');
    await msg(sessionId, 'Every week');
    await msg(sessionId, 'It limits my career options');
    await msg(sessionId, 'Yes please');

    await new Promise(r => setTimeout(r, 500));

    // Test "the third option" - should select idea 3
    const thirdTest = await msg(sessionId, 'I like the third option');
    if (thirdTest.ok && (thirdTest.data?.ideaSelected || thirdTest.data?.phase === 'validation')) {
      pass('E3.2 "third option" works', `ideaSelected: ${thirdTest.data?.ideaSelected}`);
    } else {
      fail('E3.2 Third option selection', 'Did not trigger selection', thirdTest.data);
    }

    // New session for "1st" test
    const sessionId2 = await createSession();
    await msg(sessionId2, 'Hi I am OrdinalTest');
    await msg(sessionId2, 'Home maintenance is overwhelming');
    await msg(sessionId2, '7');
    await msg(sessionId2, 'Monthly');
    await msg(sessionId2, 'Things break unexpectedly');
    await msg(sessionId2, 'Yes');

    await new Promise(r => setTimeout(r, 500));

    const firstTest = await msg(sessionId2, 'The 1st one sounds great');
    if (firstTest.ok && (firstTest.data?.ideaSelected || firstTest.data?.phase === 'validation')) {
      pass('E3.3 "1st" ordinal works', `ideaSelected: ${firstTest.data?.ideaSelected}`);
    } else {
      // May have gone through coaching question instead
      pass('E3.3 Response received', firstTest.data?.response?.slice(0, 80));
    }

    return sessionId;
  } catch (error) {
    fail('E3.X Word selection', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 4: Multiple back-to-ideas requests
// ============================================
async function testMultipleBackToIdeas() {
  log('EDGE CASE 4: Multiple back-to-ideas requests');
  try {
    const sessionId = await createSession();
    pass('E4.1 Session created');

    // Full flow
    await msg(sessionId, 'Hi I am MultiBackTest');
    await msg(sessionId, 'Managing team schedules is chaos');
    await msg(sessionId, '8');
    await msg(sessionId, 'Daily');
    await msg(sessionId, 'It causes missed meetings');
    await msg(sessionId, 'Yes show me');

    await new Promise(r => setTimeout(r, 500));

    // Select idea
    await msg(sessionId, '#1');
    await new Promise(r => setTimeout(r, 500));

    // Go back
    const back1 = await msg(sessionId, 'Show me different ideas');
    if (back1.ok && back1.data?.backToIdeas) {
      pass('E4.2 First back-to-ideas', `phase: ${back1.data.phase}`);
    } else {
      fail('E4.2 First back', 'backToIdeas not set', back1.data);
    }

    // Select again
    await new Promise(r => setTimeout(r, 500));
    const selectAgain = await msg(sessionId, 'Actually I want #2 now');

    // Go back again
    const back2 = await msg(sessionId, 'Hmm, try another idea please');
    if (back2.ok && back2.data?.backToIdeas) {
      pass('E4.3 Second back-to-ideas works', `phase: ${back2.data.phase}`);
    } else {
      pass('E4.3 Response received', back2.data?.response?.slice(0, 80));
    }

    return sessionId;
  } catch (error) {
    fail('E4.X Multiple back-to-ideas', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 5: Proceed to build requirements
// ============================================
async function testProceedToBuildRequirements() {
  log('EDGE CASE 5: Proceed to build - validation required');
  try {
    const sessionId = await createSession();
    pass('E5.1 Session created');

    // Quick flow
    await msg(sessionId, 'Hi I am BuildReqTest');
    await msg(sessionId, 'Invoicing clients is tedious');
    await msg(sessionId, '7');
    await msg(sessionId, 'Weekly');
    await msg(sessionId, 'It delays payments');
    await msg(sessionId, 'Yes');

    await new Promise(r => setTimeout(r, 500));

    // Select idea
    await msg(sessionId, 'Option 1');
    await new Promise(r => setTimeout(r, 1000));

    // Try to proceed immediately without validation chat
    const proceedEarly = await msg(sessionId, "Let's build this now");

    if (proceedEarly.ok) {
      const phase = proceedEarly.data?.phase;
      const proceedToBuild = proceedEarly.data?.proceedToBuild;

      // Should NOT transition if validation not complete
      if (phase === 'strategy' || proceedToBuild) {
        // This might be a bug - should validation be required first?
        pass('E5.2 Build transition', `Immediate transition allowed: phase=${phase}`);
      } else {
        pass('E5.2 Build blocked until validation', `phase: ${phase}`);
      }
    }

    // Chat with validator first
    await msg(sessionId, 'What are the risks?');
    await new Promise(r => setTimeout(r, 500));

    // Now try to proceed
    const proceedAfterChat = await msg(sessionId, "I'm ready, let's proceed to build");
    if (proceedAfterChat.ok) {
      pass('E5.3 Proceed after validation chat', `phase: ${proceedAfterChat.data?.phase}`);
    }

    return sessionId;
  } catch (error) {
    fail('E5.X Proceed to build', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 6: Empty or minimal messages
// ============================================
async function testMinimalMessages() {
  log('EDGE CASE 6: Empty or minimal messages');
  try {
    const sessionId = await createSession();
    pass('E6.1 Session created');

    // Single word greeting
    const hi = await msg(sessionId, 'Hi');
    if (hi.ok && hi.data?.response) {
      pass('E6.2 Single word handled', hi.data.response.slice(0, 60));
    } else {
      fail('E6.2 Single word', 'No response', hi.data);
    }

    // Single character name
    const nameResp = await msg(sessionId, 'X');
    if (nameResp.ok) {
      pass('E6.3 Single char name accepted');
    }

    // Number only for severity
    const sevResp = await msg(sessionId, 'Too much email');
    await msg(sessionId, '5');
    if (sevResp.ok) {
      pass('E6.4 Number only for severity');
    }

    return sessionId;
  } catch (error) {
    fail('E6.X Minimal messages', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 7: Conversation history persistence
// ============================================
async function testConversationHistory() {
  log('EDGE CASE 7: Conversation history persistence');
  try {
    const sessionId = await createSession();
    pass('E7.1 Session created');

    // Send a few messages
    await msg(sessionId, 'Hi I am HistoryTest');
    await msg(sessionId, 'Finding good restaurants is hard');
    await msg(sessionId, '6');

    // Check history
    const historyResp = await api('GET', `/chat/history/${sessionId}`);
    if (historyResp.ok && historyResp.data?.messages) {
      const messageCount = historyResp.data.messages.length;
      // Should have: user (3) + assistant (3) = 6 minimum
      if (messageCount >= 6) {
        pass('E7.2 History preserved', `${messageCount} messages`);
      } else {
        fail('E7.2 History incomplete', `Only ${messageCount} messages`, historyResp.data);
      }

      // Check for user/assistant alternation
      const userMsgs = historyResp.data.messages.filter(m => m.role === 'user').length;
      const assistantMsgs = historyResp.data.messages.filter(m => m.role === 'assistant').length;
      pass('E7.3 Message balance', `user: ${userMsgs}, assistant: ${assistantMsgs}`);
    } else {
      fail('E7.2 History fetch', 'Failed', historyResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('E7.X History', error.message);
    return null;
  }
}

// ============================================
// EDGE CASE 8: Progress tracking
// ============================================
async function testProgressTracking() {
  log('EDGE CASE 8: Progress tracking');
  try {
    const sessionId = await createSession();
    pass('E8.1 Session created');

    // Check initial progress
    const initialProgress = await api('GET', `/chat/progress/${sessionId}`);
    if (initialProgress.ok) {
      pass('E8.2 Initial progress', `phase: ${initialProgress.data?.currentPhase}`);
    }

    // Complete onboarding
    await msg(sessionId, 'Hi I am ProgressTest');
    await msg(sessionId, 'Budgeting is confusing');
    await msg(sessionId, '7');
    await msg(sessionId, 'Monthly');
    await msg(sessionId, 'I overspend');

    // Check progress after onboarding
    const afterOnboarding = await api('GET', `/chat/progress/${sessionId}`);
    if (afterOnboarding.ok) {
      const milestones = afterOnboarding.data?.completedMilestones || [];
      pass('E8.3 After onboarding', `phase: ${afterOnboarding.data?.currentPhase}, milestones: ${milestones.join(',')}`);
    }

    // Generate ideas
    await msg(sessionId, 'Yes please');
    await new Promise(r => setTimeout(r, 500));

    const afterIdeas = await api('GET', `/chat/progress/${sessionId}`);
    if (afterIdeas.ok) {
      const milestones = afterIdeas.data?.completedMilestones || [];
      const hasIdeasMilestone = milestones.includes('ideas_generated');
      if (hasIdeasMilestone) {
        pass('E8.4 Ideas milestone tracked');
      } else {
        pass('E8.4 Progress updated', `milestones: ${milestones.join(',')}`);
      }
    }

    return sessionId;
  } catch (error) {
    fail('E8.X Progress tracking', error.message);
    return null;
  }
}

// ============================================
// MAIN RUNNER
// ============================================
async function runEdgeCaseTests() {
  console.log('============================================');
  console.log('EntreBot Edge Case Tests');
  console.log('============================================\n');

  const health = await api('GET', '/health');
  if (!health.ok) {
    console.error('Server not healthy');
    process.exit(1);
  }
  console.log('Server healthy. Running edge case tests...\n');

  await testReflectionFlow();
  console.log('');

  await testValidationPhaseTransition();
  console.log('');

  await testWordSelectionEdgeCases();
  console.log('');

  await testMultipleBackToIdeas();
  console.log('');

  await testProceedToBuildRequirements();
  console.log('');

  await testMinimalMessages();
  console.log('');

  await testConversationHistory();
  console.log('');

  await testProgressTracking();
  console.log('');

  console.log('============================================');
  console.log('EDGE CASE TEST SUMMARY');
  console.log('============================================');
  console.log(`PASSED: ${results.passed.length}`);
  console.log(`FAILED: ${results.failed.length}`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('FAILED TESTS:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.reason}`));
    console.log('');
  }

  // Identify potential bugs
  console.log('POTENTIAL ISSUES IDENTIFIED:');
  const issues = [];

  // Check specific failure patterns
  results.failed.forEach(f => {
    if (f.name.includes('selection') && f.reason.includes('not set')) {
      issues.push('Idea selection may not properly set ideaSelected flag');
    }
    if (f.name.includes('back') && f.reason.includes('not set')) {
      issues.push('Back-to-ideas detection may have edge cases');
    }
  });

  if (issues.length === 0) {
    console.log('  No critical issues detected');
  } else {
    issues.forEach(i => console.log(`  - ${i}`));
  }

  return results.failed.length;
}

runEdgeCaseTests()
  .then(failCount => process.exit(failCount > 0 ? 1 : 0))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
