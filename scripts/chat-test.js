#!/usr/bin/env node
/**
 * Standalone Chat Test Script
 *
 * Test chat interactions independent of the UI.
 * Simulates the full conversation flow with real database and agents.
 *
 * Usage:
 *   node scripts/chat-test.js [--session <id>] [--verbose]
 *
 * Commands:
 *   /new              Start a fresh session
 *   /state            Show current memory and journey state
 *   /phase            Show current phase info
 *   /history          Show conversation history
 *   /clear            Clear memory (reset session state)
 *   /ideas            Force idea generation (skip to ideation)
 *   /validate         Force validation phase
 *   /debug            Toggle debug output
 *   /help             Show this help
 *   /quit             Exit
 */

import readline from 'readline';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment before importing app modules
dotenv.config();

// Dynamically import app modules after env is loaded
const { orchestrator, PHASES } = await import('../src/orchestrator/index.js');
const { getAgent } = await import('../src/agents/index.js');
const { conversationQueries, memoryQueries, sessionQueries, userQueries } = await import('../src/database/queries.js');
const { handleAgentResponse, parseIdeaSelection, isBackToIdeasRequest, isProceedToBuildRequest } = await import('../src/services/chat.js');
const { initializeSupabase, getSupabase } = await import('../src/database/supabase.js');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

// Test persona for automated testing
const RALPH_WIGGUM = {
  name: 'Ralph',
  conversations: [
    // Iteration 1: Simple flow
    ['Hi', 'Ralph', 'I hate waiting in line at the DMV, it takes forever', 'Like every few months', 'Maybe a 6', 'Everyone I know complains about it', 'I guess because life is short and I waste it waiting', 'yes'],
    // Iteration 2: Different pain point
    ['Hello!', 'Ralph', 'My cat keeps knocking things off the table and I have to clean it up', 'Every single day', '8 out of 10', 'My neighbors have the same problem', 'Because I love my stuff', 'ready for ideas'],
    // Iteration 3: Work-related frustration
    ['Hey there', "It's Ralph", 'I spend hours in meetings that could be emails', 'Multiple times a week', 'About 7', 'Everyone at my job', "Time is money and I'm wasting both", 'show me ideas'],
    // Iteration 4: Tech frustration
    ['Howdy', 'Ralph Wiggum', "My phone battery dies right when I need it most", 'Almost daily', '9', 'All my friends too', "Because it's always at the worst time", 'yes please'],
    // Iteration 5: Short answers
    ['Hi', 'Ralph', 'Forgetting passwords all the time', 'Daily', '5', 'Yes everyone', 'Annoying', 'ideas please'],
  ]
};

class ChatTester {
  constructor(options = {}) {
    this.sessionId = options.sessionId || null;
    this.verbose = options.verbose || false;
    this.debugMode = options.debug || false;
    this.autoMode = options.auto || false;
    this.testIteration = options.iteration || 0;
    this.testUserId = null;
    this.testEmail = `ralph.wiggum.${Date.now()}@test.entrebot.com`;
  }

  async initialize() {
    console.log(c('cyan', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(c('bright', '  📱 EntreBot Chat Tester'));
    console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Initialize Supabase
    try {
      initializeSupabase();
      console.log(c('green', '  ✓ Database connected'));
    } catch (error) {
      console.log(c('red', `  ✗ Database error: ${error.message}`));
      process.exit(1);
    }

    // Create or find test user
    await this.ensureTestUser();

    // Create or use existing session
    if (!this.sessionId) {
      await this.createSession();
    } else {
      console.log(c('gray', `  ↳ Using session: ${this.sessionId}`));
    }

    if (!this.autoMode) {
      console.log(c('gray', '\n  Type /help for commands, /quit to exit\n'));
    }
    console.log(c('cyan', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  async ensureTestUser() {
    const supabase = getSupabase();

    // Try to find existing test user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .like('email', 'ralph.wiggum.%@test.entrebot.com')
      .limit(1)
      .single();

    if (existingUser) {
      this.testUserId = existingUser.id;
      console.log(c('gray', '  ↳ Using existing test user'));
      return;
    }

    // Create new test user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: this.testEmail,
        name: 'Ralph Wiggum',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    this.testUserId = newUser.id;
    console.log(c('green', '  ✓ Test user created (Ralph Wiggum)'));
  }

  async createSession() {
    const result = await sessionQueries.create(this.testUserId);
    if (!result.success) {
      throw new Error(`Failed to create session: ${result.error}`);
    }
    this.sessionId = result.session.id;
    console.log(c('green', `  ✓ New session created`));
    console.log(c('gray', `  ↳ ID: ${this.sessionId}`));
  }

  async processMessage(message) {
    const trimmed = message.trim();

    // Handle commands
    if (trimmed.startsWith('/')) {
      return await this.handleCommand(trimmed);
    }

    // Skip empty messages
    if (!trimmed) {
      return;
    }

    const lowerMessage = trimmed.toLowerCase();

    // Store user message
    await conversationQueries.create(this.sessionId, 'user', trimmed);

    // Use orchestrator to determine routing
    const routing = await orchestrator.route(this.sessionId, trimmed);
    let { agent, phase, phaseChanged } = routing;

    // Show routing info
    if (this.debugMode) {
      console.log(c('gray', `\n  [DEBUG] Phase: ${phase}, Agent: ${agent.name}, Changed: ${phaseChanged}`));
    }

    // Response tracking
    let response;
    let metadata = { agent: agent.name };

    // Handle idea selection
    const existingIdeas = await memoryQueries.get(this.sessionId, 'GeneratedIdeas');
    if (existingIdeas?.generated) {
      const selectedNumber = parseIdeaSelection(trimmed);
      if (selectedNumber) {
        const ideaGenerator = getAgent('ideaGenerator');
        await ideaGenerator.selectIdea(this.sessionId, selectedNumber, trimmed);
        await memoryQueries.set(this.sessionId, 'Validator', null);
        await orchestrator.updateState(this.sessionId, { currentPhase: 'validation' });
        await orchestrator.addMilestone(this.sessionId, 'idea_selected');

        response = `Great choice! You've selected idea #${selectedNumber}. Let me validate this idea and see how it stacks up in the market...`;
        phase = 'validation';
        phaseChanged = true;
        metadata.ideaSelected = true;
      }
    }

    // Handle back-to-ideas request
    if (!response && isBackToIdeasRequest(lowerMessage)) {
      await memoryQueries.set(this.sessionId, 'SelectedIdea', null);
      await memoryQueries.set(this.sessionId, 'Validator', null);
      await memoryQueries.set(this.sessionId, 'GeneratedIdeas', null);
      await orchestrator.updateState(this.sessionId, { currentPhase: 'ideation' });

      response = "No problem! Let's go back and explore other ideas for your pain point...";
      phase = 'ideation';
      phaseChanged = true;
      metadata.backToIdeas = true;
    }

    // Route to agent if no special case handled
    if (!response) {
      response = await handleAgentResponse(agent, this.sessionId, trimmed, lowerMessage);
    }

    // Store agent response
    await conversationQueries.create(this.sessionId, 'assistant', response, metadata);

    // Check for phase transitions
    let onboardingComplete = false;
    if (agent.name === 'Onboarding') {
      onboardingComplete = await agent.isComplete(this.sessionId);
      if (onboardingComplete) {
        await orchestrator.updateState(this.sessionId, { currentPhase: 'ideation' });
        await orchestrator.addMilestone(this.sessionId, 'pain_articulated');
        phaseChanged = true;
        phase = 'ideation';
      }
    }

    // Print response
    this.printResponse(response, agent.name, phase, phaseChanged, onboardingComplete);
  }

  printResponse(response, agentName, phase, phaseChanged, onboardingComplete) {
    console.log();

    // Phase change notification
    if (phaseChanged) {
      const phaseInfo = PHASES[phase];
      console.log(c('yellow', `  ⚡ Phase transition → ${phaseInfo?.name || phase}`));
      if (phaseInfo?.description) {
        console.log(c('gray', `     ${phaseInfo.description}`));
      }
      console.log();
    }

    // Onboarding complete notification
    if (onboardingComplete) {
      console.log(c('green', '  ✓ Onboarding complete! Moving to idea generation.\n'));
    }

    // Agent tag
    console.log(c('magenta', `  [${agentName}]`));

    // Response with proper wrapping
    const wrapped = this.wrapText(response, 60);
    wrapped.forEach(line => {
      console.log(c('white', `  ${line}`));
    });

    console.log();
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  async handleCommand(cmd) {
    const [command, ...args] = cmd.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'new':
        await this.createSession();
        console.log(c('green', '\n  ✓ Fresh session started\n'));
        break;

      case 'state':
        await this.showState();
        break;

      case 'phase':
        await this.showPhase();
        break;

      case 'history':
        await this.showHistory(parseInt(args[0]) || 10);
        break;

      case 'clear':
        await this.clearMemory();
        break;

      case 'ideas':
        await this.forcePhase('ideation');
        break;

      case 'validate':
        await this.forcePhase('validation');
        break;

      case 'debug':
        this.debugMode = !this.debugMode;
        console.log(c('yellow', `\n  Debug mode: ${this.debugMode ? 'ON' : 'OFF'}\n`));
        break;

      case 'help':
        this.showHelp();
        break;

      case 'quit':
      case 'exit':
      case 'q':
        console.log(c('gray', '\n  Goodbye! 👋\n'));
        process.exit(0);

      default:
        console.log(c('red', `\n  Unknown command: ${command}`));
        console.log(c('gray', '  Type /help for available commands\n'));
    }
  }

  async showState() {
    const state = await orchestrator.getState(this.sessionId);
    const progress = await orchestrator.getProgress(this.sessionId);

    console.log(c('cyan', '\n  ─────────────────────────────────────────'));
    console.log(c('bright', '  📊 Session State'));
    console.log(c('cyan', '  ─────────────────────────────────────────\n'));

    // Journey state
    console.log(c('yellow', '  Journey:'));
    console.log(c('white', `    Phase: ${state.currentPhase} (${PHASES[state.currentPhase]?.name || 'Unknown'})`));
    console.log(c('white', `    Progress: ${progress.progress.percentage}%`));
    console.log(c('white', `    Milestones: ${state.milestones?.length || 0}`));
    if (state.milestones?.length) {
      state.milestones.forEach(m => console.log(c('gray', `      • ${m}`)));
    }
    console.log();

    // Memory
    console.log(c('yellow', '  Memory:'));
    const memory = state.memory || {};
    const keys = Object.keys(memory).filter(k => k !== 'JOURNEY_STATE');

    if (keys.length === 0) {
      console.log(c('gray', '    (empty)'));
    } else {
      for (const key of keys) {
        const value = memory[key];
        console.log(c('cyan', `    ${key}:`));
        if (typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            const display = typeof v === 'string' && v.length > 40
              ? v.slice(0, 40) + '...'
              : v;
            console.log(c('white', `      ${k}: ${display}`));
          });
        } else {
          console.log(c('white', `      ${value}`));
        }
      }
    }

    console.log(c('cyan', '\n  ─────────────────────────────────────────\n'));
  }

  async showPhase() {
    const state = await orchestrator.getState(this.sessionId);
    const currentPhase = state.currentPhase || 'discovery';
    const phaseInfo = PHASES[currentPhase];

    console.log(c('cyan', '\n  ─────────────────────────────────────────'));
    console.log(c('bright', `  🎯 Current Phase: ${phaseInfo?.name || currentPhase}`));
    console.log(c('cyan', '  ─────────────────────────────────────────\n'));

    if (phaseInfo) {
      console.log(c('white', `  ${phaseInfo.description}`));
      console.log();
      console.log(c('yellow', '  Agents:'), c('white', phaseInfo.agents.join(', ')));
      console.log(c('yellow', '  Milestones:'), c('white', phaseInfo.milestones.join(', ')));
      console.log(c('yellow', '  Next:'), c('white', phaseInfo.nextPhase || 'None'));

      if (phaseInfo.learningObjectives?.length) {
        console.log();
        console.log(c('yellow', '  Learning Objectives:'));
        phaseInfo.learningObjectives.forEach(obj => {
          console.log(c('gray', `    • ${obj}`));
        });
      }
    }

    console.log(c('cyan', '\n  ─────────────────────────────────────────\n'));
  }

  async showHistory(limit = 10) {
    const result = await conversationQueries.getHistory(this.sessionId, limit);

    console.log(c('cyan', '\n  ─────────────────────────────────────────'));
    console.log(c('bright', `  💬 Conversation History (last ${limit})`));
    console.log(c('cyan', '  ─────────────────────────────────────────\n'));

    if (!result.success || !result.messages?.length) {
      console.log(c('gray', '  No messages yet.\n'));
      return;
    }

    for (const msg of result.messages) {
      const roleColor = msg.role === 'user' ? 'green' : 'magenta';
      const roleLabel = msg.role === 'user' ? 'You' : (msg.metadata?.agent || 'Bot');
      const preview = msg.content.length > 60
        ? msg.content.slice(0, 60) + '...'
        : msg.content;

      console.log(c(roleColor, `  [${roleLabel}]`), c('white', preview));
    }

    console.log(c('cyan', '\n  ─────────────────────────────────────────\n'));
  }

  async clearMemory() {
    // Get all memory keys
    const result = await memoryQueries.getAll(this.sessionId);
    if (result.success && result.memory) {
      // Reset journey state
      await memoryQueries.set(this.sessionId, 'JOURNEY_STATE', {
        currentPhase: 'discovery',
        milestones: [],
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });

      // Clear other memory keys by setting to null
      const keys = Object.keys(result.memory).filter(k => k !== 'JOURNEY_STATE');
      for (const key of keys) {
        await memoryQueries.set(this.sessionId, key, null);
      }
    }

    console.log(c('green', '\n  ✓ Memory cleared, reset to discovery phase\n'));
  }

  async forcePhase(phase) {
    await orchestrator.updateState(this.sessionId, { currentPhase: phase });
    const phaseInfo = PHASES[phase];
    console.log(c('yellow', `\n  ⚡ Forced transition to: ${phaseInfo?.name || phase}`));
    console.log(c('gray', `     ${phaseInfo?.description || ''}\n`));
  }

  showHelp() {
    console.log(c('cyan', '\n  ─────────────────────────────────────────'));
    console.log(c('bright', '  📚 Available Commands'));
    console.log(c('cyan', '  ─────────────────────────────────────────\n'));

    const commands = [
      ['/new', 'Start a fresh session'],
      ['/state', 'Show current memory and journey state'],
      ['/phase', 'Show detailed phase info'],
      ['/history [n]', 'Show last n messages (default 10)'],
      ['/clear', 'Clear memory, reset to discovery'],
      ['/ideas', 'Force transition to ideation phase'],
      ['/validate', 'Force transition to validation phase'],
      ['/debug', 'Toggle debug output'],
      ['/help', 'Show this help'],
      ['/quit', 'Exit']
    ];

    commands.forEach(([cmd, desc]) => {
      console.log(c('yellow', `  ${cmd.padEnd(14)}`), c('white', desc));
    });

    console.log(c('cyan', '\n  ─────────────────────────────────────────\n'));
  }

  async run() {
    await this.initialize();

    // Auto mode: run predefined conversation
    if (this.autoMode) {
      await this.runAutoTest();
      return;
    }

    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = () => {
      rl.question(c('green', '  You: '), async (input) => {
        try {
          await this.processMessage(input);
        } catch (error) {
          console.log(c('red', `\n  Error: ${error.message}`));
          if (this.debugMode) {
            console.log(c('gray', error.stack));
          }
          console.log();
        }
        prompt();
      });
    };

    prompt();
  }

  async runAutoTest() {
    const conversations = RALPH_WIGGUM.conversations;
    const iterationIndex = this.testIteration % conversations.length;
    const messages = conversations[iterationIndex];

    console.log(c('yellow', `\n  🤖 AUTO TEST MODE - Iteration ${this.testIteration + 1}`));
    console.log(c('gray', `     Using conversation pattern #${iterationIndex + 1}\n`));

    const results = {
      iteration: this.testIteration + 1,
      sessionId: this.sessionId,
      exchanges: [],
      finalPhase: 'discovery',
      onboardingCompleted: false,
      errors: []
    };

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(c('green', `  You: ${msg}`));

      try {
        const startTime = Date.now();
        await this.processMessage(msg);
        const duration = Date.now() - startTime;

        // Check state after each message
        const state = await orchestrator.getState(this.sessionId);
        results.exchanges.push({
          input: msg,
          phase: state.currentPhase,
          duration,
          success: true
        });

        results.finalPhase = state.currentPhase;

        // Check if we reached ideation
        if (state.currentPhase === 'ideation') {
          results.onboardingCompleted = true;
          console.log(c('green', '\n  ✓ SUCCESS: Reached ideation phase!\n'));
          break;
        }

        // Small delay between messages for rate limiting
        await new Promise(r => setTimeout(r, 500));

      } catch (error) {
        results.errors.push({ message: msg, error: error.message });
        results.exchanges.push({
          input: msg,
          error: error.message,
          success: false
        });
        console.log(c('red', `  Error: ${error.message}\n`));
      }
    }

    // Print summary
    console.log(c('cyan', '\n  ─────────────────────────────────────────'));
    console.log(c('bright', '  📊 Test Summary'));
    console.log(c('cyan', '  ─────────────────────────────────────────\n'));

    console.log(c('white', `  Iteration: ${results.iteration}`));
    console.log(c('white', `  Session: ${results.sessionId}`));
    console.log(c('white', `  Exchanges: ${results.exchanges.length}`));
    console.log(c('white', `  Final Phase: ${results.finalPhase}`));
    console.log(c('white', `  Onboarding Done: ${results.onboardingCompleted ? '✓' : '✗'}`));
    console.log(c('white', `  Errors: ${results.errors.length}`));

    if (results.errors.length > 0) {
      console.log(c('red', '\n  Errors:'));
      results.errors.forEach(e => {
        console.log(c('red', `    • "${e.message.slice(0, 30)}...": ${e.error}`));
      });
    }

    // Show final state
    console.log(c('yellow', '\n  Final Memory State:'));
    const finalState = await orchestrator.getState(this.sessionId);
    const memory = finalState.memory || {};
    ['USER_PROFILE', 'USER_PAIN'].forEach(key => {
      if (memory[key]) {
        console.log(c('cyan', `    ${key}:`));
        Object.entries(memory[key]).forEach(([k, v]) => {
          const display = typeof v === 'string' && v.length > 50
            ? v.slice(0, 50) + '...'
            : v;
          console.log(c('white', `      ${k}: ${display}`));
        });
      }
    });

    console.log(c('cyan', '\n  ─────────────────────────────────────────\n'));

    // Return results for programmatic use
    return results;
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  sessionId: null,
  verbose: false,
  auto: false,
  iteration: 0,
  debug: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--session' && args[i + 1]) {
    options.sessionId = args[++i];
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    options.verbose = true;
  } else if (args[i] === '--auto' || args[i] === '-a') {
    options.auto = true;
  } else if (args[i] === '--iteration' && args[i + 1]) {
    options.iteration = parseInt(args[++i]) || 0;
  } else if (args[i] === '--debug' || args[i] === '-d') {
    options.debug = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
EntreBot Chat Tester

Usage: node scripts/chat-test.js [options]

Options:
  --session <id>    Use existing session ID
  --auto, -a        Run automated test with Ralph Wiggum persona
  --iteration <n>   Specify which test conversation to use (0-4)
  --debug, -d       Enable debug output
  --verbose, -v     Verbose mode
  --help, -h        Show this help

Examples:
  node scripts/chat-test.js              # Interactive mode
  node scripts/chat-test.js --auto       # Auto test mode
  node scripts/chat-test.js -a -d        # Auto test with debug
  node scripts/chat-test.js --iteration 2 --auto  # Run specific test
`);
    process.exit(0);
  }
}

// Run the tester
const tester = new ChatTester(options);
tester.run().catch(error => {
  console.error(c('red', `Fatal error: ${error.message}`));
  process.exit(1);
});
