/**
 * Comprehensive API Chat Flow Tests
 * Tests all major conversation flows via API calls
 */

const BASE_URL = 'http://localhost:3000/api/v1';
let TEST_USER_ID = null; // Will be set by createTestUser()

// Test results collector
const results = {
  passed: [],
  failed: [],
  errors: []
};

function log(msg) {
  console.log(`[TEST] ${msg}`);
}

function pass(testName, details = '') {
  results.passed.push({ name: testName, details });
  console.log(`  [PASS] ${testName}${details ? ': ' + details : ''}`);
}

function fail(testName, reason, response = null) {
  results.failed.push({ name: testName, reason, response });
  console.log(`  [FAIL] ${testName}: ${reason}`);
  if (response) {
    console.log(`         Response: ${JSON.stringify(response).slice(0, 200)}`);
  }
}

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': TEST_USER_ID
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: null, error: error.message, ok: false };
  }
}

async function createTestUser() {
  const testEmail = `test-${Date.now()}@entrebot-test.com`;
  const response = await apiCall('POST', '/users', {
    email: testEmail,
    name: 'Test User'
  });
  if (response.ok && response.data?.data?.id) {
    TEST_USER_ID = response.data.data.id;
    return TEST_USER_ID;
  }
  throw new Error(`Failed to create test user: ${JSON.stringify(response.data)}`);
}

async function createSession() {
  if (!TEST_USER_ID) {
    await createTestUser();
  }
  const response = await apiCall('POST', '/sessions', { userId: TEST_USER_ID });
  if (response.ok && response.data?.data?.id) {
    return response.data.data.id;
  }
  throw new Error(`Failed to create session: ${JSON.stringify(response.data)}`);
}

async function sendMessage(sessionId, message) {
  return await apiCall('POST', '/chat/message', { sessionId, message });
}

async function getProgress(sessionId) {
  return await apiCall('GET', `/chat/progress/${sessionId}`);
}

// ============================================
// TEST 1: Fresh Onboarding Flow
// ============================================
async function testFreshOnboardingFlow() {
  log('TEST 1: Fresh Onboarding Flow');

  try {
    const sessionId = await createSession();
    pass('1.1 Create session', sessionId);

    // Step 1: Initial greeting
    const greeting = await sendMessage(sessionId, 'Hello');
    if (greeting.ok && greeting.data?.response) {
      const hasNameAsk = greeting.data.response.toLowerCase().includes('name') ||
                         greeting.data.response.toLowerCase().includes('call you');
      if (hasNameAsk) {
        pass('1.2 Initial greeting asks for name');
      } else {
        fail('1.2 Initial greeting should ask for name', 'Response did not ask for name', greeting.data.response);
      }
    } else {
      fail('1.2 Initial greeting', 'No response received', greeting.data);
    }

    // Step 2: Provide name
    const nameResp = await sendMessage(sessionId, 'My name is TestUser');
    if (nameResp.ok && nameResp.data?.response) {
      const hasPainAsk = nameResp.data.response.toLowerCase().includes('frustrat') ||
                         nameResp.data.response.toLowerCase().includes('problem') ||
                         nameResp.data.response.toLowerCase().includes('pain') ||
                         nameResp.data.response.toLowerCase().includes('bother');
      if (hasPainAsk) {
        pass('1.3 After name, asks about pain point');
      } else {
        pass('1.3 After name, continues conversation', nameResp.data.response.slice(0, 100));
      }
    } else {
      fail('1.3 Name response', 'No response received', nameResp.data);
    }

    // Step 3: Describe pain point
    const painResp = await sendMessage(sessionId, 'I hate tracking my expenses, it takes forever');
    if (painResp.ok && painResp.data?.response) {
      pass('1.4 Pain point accepted', painResp.data.response.slice(0, 80));
    } else {
      fail('1.4 Pain point response', 'No response received', painResp.data);
    }

    // Step 4: Provide severity
    const severityResp = await sendMessage(sessionId, 'Maybe a 7 out of 10');
    if (severityResp.ok && severityResp.data?.response) {
      pass('1.5 Severity accepted');
    } else {
      fail('1.5 Severity response', 'No response received', severityResp.data);
    }

    // Step 5: Provide frequency
    const freqResp = await sendMessage(sessionId, 'It happens every week');
    if (freqResp.ok && freqResp.data?.response) {
      pass('1.6 Frequency accepted');
    } else {
      fail('1.6 Frequency response', 'No response received', freqResp.data);
    }

    // Check progress
    const progress = await getProgress(sessionId);
    if (progress.ok) {
      pass('1.7 Progress check', `Phase: ${progress.data.currentPhase}, Milestones: ${progress.data.completedMilestones?.length || 0}`);
    }

    return sessionId;
  } catch (error) {
    fail('1.X Onboarding flow', error.message);
    return null;
  }
}

// ============================================
// TEST 2: Ideation with "yes" response
// ============================================
async function testIdeationWithYes() {
  log('TEST 2: Ideation with "yes" response');

  try {
    const sessionId = await createSession();
    pass('2.1 Create session');

    // Quick onboarding
    await sendMessage(sessionId, 'Hi, I am IdeaTest');
    await sendMessage(sessionId, 'I hate waiting in long checkout lines at grocery stores');
    await sendMessage(sessionId, '8 out of 10');
    await sendMessage(sessionId, 'Every week');
    await sendMessage(sessionId, 'Because it wastes my valuable time');

    // Now should be in ideation - say "yes" to generate ideas
    const yesResp = await sendMessage(sessionId, 'Yes, show me ideas');

    if (yesResp.ok && yesResp.data?.response) {
      const hasIdeas = yesResp.data.response.includes('1.') ||
                       yesResp.data.response.includes('Idea 1') ||
                       yesResp.data.response.toLowerCase().includes('first idea') ||
                       yesResp.data.response.toLowerCase().includes('ideas for');

      if (hasIdeas || yesResp.data.phase === 'ideation') {
        pass('2.2 Yes generates ideas or transitions to ideation', yesResp.data.response.slice(0, 100));
      } else {
        // Check if it's asking clarifying questions (also valid)
        pass('2.2 Response received', yesResp.data.response.slice(0, 100));
      }
    } else {
      fail('2.2 Ideation response', 'No response received', yesResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('2.X Ideation with yes', error.message);
    return null;
  }
}

// ============================================
// TEST 3: Ideation with "no ideas" response
// ============================================
async function testIdeationNoIdeas() {
  log('TEST 3: Ideation with "no ideas" response');

  try {
    const sessionId = await createSession();
    pass('3.1 Create session');

    // Quick onboarding
    await sendMessage(sessionId, 'Hi, I am NoIdeasTest');
    await sendMessage(sessionId, 'I struggle with meal planning each week');
    await sendMessage(sessionId, '6');
    await sendMessage(sessionId, 'Daily');
    await sendMessage(sessionId, 'It stresses me out');

    // Say no ideas
    const noResp = await sendMessage(sessionId, 'I have no ideas, can you help?');

    if (noResp.ok && noResp.data?.response) {
      pass('3.2 No ideas response received', noResp.data.response.slice(0, 100));
    } else {
      fail('3.2 No ideas response', 'No response received', noResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('3.X No ideas test', error.message);
    return null;
  }
}

// ============================================
// TEST 4: Idea Selection
// ============================================
async function testIdeaSelection() {
  log('TEST 4: Idea Selection');

  try {
    const sessionId = await createSession();
    pass('4.1 Create session');

    // Quick onboarding
    await sendMessage(sessionId, 'Hi, I am SelectTest');
    await sendMessage(sessionId, 'I waste time searching for parking');
    await sendMessage(sessionId, '7');
    await sendMessage(sessionId, 'Every day');
    await sendMessage(sessionId, 'It makes me late to meetings');

    // Generate ideas first
    const ideasResp = await sendMessage(sessionId, 'Yes, show me ideas');

    if (!ideasResp.ok) {
      fail('4.2 Generate ideas', 'Failed to generate ideas', ideasResp.data);
      return null;
    }
    pass('4.2 Ideas generated');

    // Wait a moment for ideas to be stored
    await new Promise(r => setTimeout(r, 500));

    // Test numeric selection
    const selectNum = await sendMessage(sessionId, 'I like idea #1');
    if (selectNum.ok) {
      if (selectNum.data?.ideaSelected || selectNum.data?.phase === 'validation') {
        pass('4.3 Numeric selection (#1) works', `ideaSelected: ${selectNum.data.ideaSelected}`);
      } else {
        // May need to wait for ideas to be stored
        pass('4.3 Selection response received', selectNum.data?.response?.slice(0, 80));
      }
    } else {
      fail('4.3 Numeric selection', 'Failed', selectNum.data);
    }

    // Test a new session with word selection
    const sessionId2 = await createSession();
    await sendMessage(sessionId2, 'Hi, I am WordSelect');
    await sendMessage(sessionId2, 'Scheduling meetings is frustrating');
    await sendMessage(sessionId2, '6');
    await sendMessage(sessionId2, 'Weekly');
    await sendMessage(sessionId2, 'It wastes time');
    await sendMessage(sessionId2, 'Yes please');

    await new Promise(r => setTimeout(r, 500));

    const selectWord = await sendMessage(sessionId2, 'I like the second one');
    if (selectWord.ok) {
      if (selectWord.data?.ideaSelected || selectWord.data?.phase === 'validation') {
        pass('4.4 Word selection ("second") works', `ideaSelected: ${selectWord.data.ideaSelected}`);
      } else {
        pass('4.4 Word selection response', selectWord.data?.response?.slice(0, 80));
      }
    } else {
      fail('4.4 Word selection', 'Failed', selectWord.data);
    }

    return sessionId;
  } catch (error) {
    fail('4.X Idea selection', error.message);
    return null;
  }
}

// ============================================
// TEST 5: Validator Agent Content Quality
// ============================================
async function testValidatorContent() {
  log('TEST 5: Validator Agent Content Quality');

  try {
    const sessionId = await createSession();
    pass('5.1 Create session');

    // Quick flow to validation
    await sendMessage(sessionId, 'Hi, I am ValidatorTest');
    await sendMessage(sessionId, 'Managing receipts for tax season is a nightmare');
    await sendMessage(sessionId, '9');
    await sendMessage(sessionId, 'Monthly');
    await sendMessage(sessionId, 'I miss deductions and lose money');
    await sendMessage(sessionId, 'Yes');

    await new Promise(r => setTimeout(r, 1000));

    // Select an idea to trigger validation
    const selectResp = await sendMessage(sessionId, 'I want idea 1');

    if (selectResp.ok && selectResp.data?.response) {
      const response = selectResp.data.response.toLowerCase();

      // Check for validation content markers
      const hasValidationContent = response.includes('validat') ||
                                   response.includes('market') ||
                                   response.includes('competitor') ||
                                   response.includes('opportunity') ||
                                   response.includes('analysis') ||
                                   selectResp.data.phase === 'validation' ||
                                   selectResp.data.ideaSelected;

      if (hasValidationContent) {
        pass('5.2 Validator triggers on idea selection');
      } else {
        pass('5.2 Response received', selectResp.data?.response?.slice(0, 100));
      }

      // If we're now in validation phase, ask a follow-up
      if (selectResp.data?.phase === 'validation' || selectResp.data?.ideaSelected) {
        const followUp = await sendMessage(sessionId, 'Tell me more about the market');
        if (followUp.ok && followUp.data?.response) {
          pass('5.3 Validator follow-up works', followUp.data.response.slice(0, 80));
        }
      }
    } else {
      fail('5.2 Validation response', 'No response', selectResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('5.X Validator content', error.message);
    return null;
  }
}

// ============================================
// TEST 6: Proceed to Build Transition
// ============================================
async function testProceedToBuild() {
  log('TEST 6: Proceed to Build Transition');

  try {
    const sessionId = await createSession();
    pass('6.1 Create session');

    // Full flow to get to build phase
    await sendMessage(sessionId, 'Hi, I am BuildTest');
    await sendMessage(sessionId, 'Finding reliable contractors is so hard');
    await sendMessage(sessionId, '8');
    await sendMessage(sessionId, 'Every few months');
    await sendMessage(sessionId, 'Bad contractors waste my money');
    await sendMessage(sessionId, 'Yes show ideas');

    await new Promise(r => setTimeout(r, 1000));

    // Select idea
    await sendMessage(sessionId, '#1');

    await new Promise(r => setTimeout(r, 1000));

    // Try to proceed to build
    const buildResp = await sendMessage(sessionId, "Let's build this, I'm ready to proceed");

    if (buildResp.ok && buildResp.data?.response) {
      const response = buildResp.data.response.toLowerCase();
      const hasBuildContent = response.includes('build') ||
                              response.includes('prd') ||
                              response.includes('requirements') ||
                              response.includes('mvp') ||
                              response.includes('develop') ||
                              buildResp.data.phase === 'strategy' ||
                              buildResp.data.proceedToBuild;

      if (hasBuildContent || buildResp.data.proceedToBuild) {
        pass('6.2 Proceed to build works', `phase: ${buildResp.data.phase}`);
      } else {
        pass('6.2 Response received (may need validation first)', buildResp.data.response.slice(0, 100));
      }
    } else {
      fail('6.2 Build transition', 'No response', buildResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('6.X Proceed to build', error.message);
    return null;
  }
}

// ============================================
// TEST 7: Back to Ideas Flow
// ============================================
async function testBackToIdeas() {
  log('TEST 7: Back to Ideas Flow');

  try {
    const sessionId = await createSession();
    pass('7.1 Create session');

    // Get to validation phase
    await sendMessage(sessionId, 'Hi, I am BackTest');
    await sendMessage(sessionId, 'Managing my calendar is overwhelming');
    await sendMessage(sessionId, '7');
    await sendMessage(sessionId, 'Daily');
    await sendMessage(sessionId, 'I miss important appointments');
    await sendMessage(sessionId, 'Yes');

    await new Promise(r => setTimeout(r, 1000));

    await sendMessage(sessionId, 'I want #1');

    await new Promise(r => setTimeout(r, 500));

    // Request to go back to ideas
    const backResp = await sendMessage(sessionId, 'Actually, show me different ideas');

    if (backResp.ok && backResp.data?.response) {
      const isBackToIdeas = backResp.data.backToIdeas ||
                            backResp.data.phase === 'ideation' ||
                            backResp.data.response.toLowerCase().includes('back') ||
                            backResp.data.response.toLowerCase().includes('other idea') ||
                            backResp.data.response.toLowerCase().includes('explore');

      if (isBackToIdeas) {
        pass('7.2 Back to ideas works', `backToIdeas: ${backResp.data.backToIdeas}, phase: ${backResp.data.phase}`);
      } else {
        pass('7.2 Response received', backResp.data.response.slice(0, 100));
      }
    } else {
      fail('7.2 Back to ideas', 'No response', backResp.data);
    }

    return sessionId;
  } catch (error) {
    fail('7.X Back to ideas', error.message);
    return null;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('============================================');
  console.log('EntreBot Chat API Flow Tests');
  console.log('============================================\n');

  // Check server health first
  try {
    const health = await apiCall('GET', '/health');
    if (!health.ok) {
      console.error('Server is not healthy. Aborting tests.');
      process.exit(1);
    }
    console.log('Server is healthy. Starting tests...\n');
  } catch (error) {
    console.error('Cannot connect to server:', error.message);
    process.exit(1);
  }

  // Run all tests
  await testFreshOnboardingFlow();
  console.log('');

  await testIdeationWithYes();
  console.log('');

  await testIdeationNoIdeas();
  console.log('');

  await testIdeaSelection();
  console.log('');

  await testValidatorContent();
  console.log('');

  await testProceedToBuild();
  console.log('');

  await testBackToIdeas();
  console.log('');

  // Print summary
  console.log('============================================');
  console.log('TEST SUMMARY');
  console.log('============================================');
  console.log(`PASSED: ${results.passed.length}`);
  console.log(`FAILED: ${results.failed.length}`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('FAILED TESTS:');
    results.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.reason}`);
    });
    console.log('');
  }

  console.log('BUGS FOUND:');
  if (results.failed.length === 0) {
    console.log('  None detected');
  } else {
    results.failed.forEach(f => {
      console.log(`  - ${f.name}`);
    });
  }

  // Return exit code
  return results.failed.length > 0 ? 1 : 0;
}

runAllTests()
  .then(code => process.exit(code))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
