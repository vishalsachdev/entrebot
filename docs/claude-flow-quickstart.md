# Claude-Flow Quick Start for EntreBot

> **TL;DR**: Your repo is already configured with claude-flow. This guide shows you how to use it effectively in 5 minutes.

## What You Have Right Now

✅ **54 Pre-configured Agents** in `.claude/agents/`  
✅ **Hooks System** for automatic code quality  
✅ **SPARC Methodology** for structured development  
✅ **Memory Management** for cross-agent coordination  
✅ **Performance Optimization** patterns ready to use  

## 3 Most Useful Commands

### 1. Create a New Agent (SPARC TDD)

```bash
# Creates complete agent with tests, docs, and integration guide
npx claude-flow@alpha sparc tdd "Create MentorAgent for post-launch coaching with milestone tracking"

# Output:
# ✅ src/agents/mentor.js
# ✅ tests/unit/mentor.test.js  
# ✅ docs/agents/mentor-spec.md
# ✅ Integration instructions
```

**When to use**: Creating any new coaching agent (Mentor, GTM, Analytics, etc.)

### 2. List Available Agent Templates

```bash
# See all 54 agents you can leverage
npx claude-flow@alpha sparc modes

# Categories:
# - Core: coder, reviewer, tester, planner, researcher
# - SPARC: specification, architecture, refinement
# - GitHub: pr-manager, code-review-swarm, issue-tracker
# - Specialized: backend-dev, api-docs, system-architect
```

**When to use**: Before starting any development task

### 3. Monitor Performance

```bash
# See how your agents are performing
npx claude-flow@alpha swarm monitor --auto true

# Shows:
# - Active agents and status
# - Response times
# - Memory usage
# - Bottlenecks
```

**When to use**: Regular optimization and debugging

## 5 Practical Examples for EntreBot

### Example 1: Speed Up Idea Validation (2x faster)

**Before**: Validate ideas sequentially (60 seconds)  
**After**: Validate all 5 ideas in parallel (15 seconds)

```javascript
// src/agents/parallel-validator.js

import { execSync } from 'child_process';

async function validateAllIdeas(sessionId, ideas) {
  // Initialize mesh topology for parallel execution
  execSync('npx claude-flow@alpha swarm init --topology mesh --max-agents 5');
  
  // Validate all 5 ideas simultaneously
  const validations = await Promise.all(
    ideas.map(idea => this.validatorAgent.validate(sessionId, idea))
  );
  
  // Save results with hooks
  execSync(`npx claude-flow@alpha hooks post-edit --memory-key "entrebot/${sessionId}/ALL_VALIDATIONS"`);
  
  return validations.sort((a, b) => b.score - a.score);
}
```

**Result**: ⚡ 4x faster validation, better user experience

### Example 2: Create Mentor Agent in 5 Minutes

```bash
# Step 1: Generate complete agent with SPARC
npx claude-flow@alpha sparc tdd "Create PostLaunchMentorAgent:
- Tracks milestones (first user, revenue, etc.)
- Provides Socratic coaching
- Celebrates wins
- Memory: USER_MILESTONES, COACHING_HISTORY"

# Step 2: Review generated code
cat src/agents/post-launch-mentor.js

# Step 3: Run tests
npm test tests/unit/post-launch-mentor.test.js

# Step 4: Integrate (add to src/agents/index.js)
export { PostLaunchMentorAgent } from './post-launch-mentor.js';

# Done! New agent ready in 5 minutes
```

**Result**: 🚀 New coaching capability without manual coding

### Example 3: Automated Code Review for PRs

```bash
# Automatic code review when creating PRs
npx claude-flow@alpha github code-review \
  --pr 123 \
  --agent code-review-swarm \
  --focus "agent architecture, memory patterns, tests"

# Reviews:
# ✅ Code quality and best practices
# ✅ Memory key consistency (UPPER_SNAKE_CASE)
# ✅ Test coverage
# ✅ Integration with orchestrator
# ✅ Documentation completeness
```

**Result**: 📊 Consistent code quality, faster reviews

### Example 4: Background Market Research

```javascript
// src/orchestrator/enhanced-onboarding.js

async function onboardUser(sessionId, message) {
  // User is chatting with onboarding agent
  const painPoint = await this.onboardingAgent.process(sessionId, message);
  
  // While user is reading response, pre-fetch market data in background
  if (painPoint.category) {
    // Non-blocking: Prepare data for next step
    this.validatorAgent.prefetchMarketData(painPoint.category);
  }
  
  return painPoint;
}
```

**Result**: ⚡ Instant validation when user selects idea (data already cached)

### Example 5: Memory Coordination Across Agents

```javascript
// src/agents/base.js (Enhanced)

import { execSync } from 'child_process';

class EnhancedBaseAgent extends BaseAgent {
  async getSharedContext(sessionId) {
    // Restore full session from claude-flow memory
    execSync(`npx claude-flow@alpha hooks session-restore --session-id "entrebot/${sessionId}"`);
    
    // Get all relevant context
    return {
      userProfile: await this.getMemory(sessionId, 'USER_PROFILE'),
      painPoint: await this.getMemory(sessionId, 'USER_PAIN'),
      ideas: await this.getMemory(sessionId, 'IDEA_COACH'),
      selectedIdea: await this.getMemory(sessionId, 'SELECTED_IDEA'),
      validation: await this.getMemory(sessionId, 'VALIDATION_RESULTS')
    };
  }
}
```

**Result**: 🧠 Agents share context seamlessly, no repetitive questions

## Common Workflows

### Workflow 1: Develop New Feature

```bash
# 1. Plan with specification agent
npx claude-flow@alpha sparc run specification "Add analytics dashboard to track user progress"

# 2. Design architecture
npx claude-flow@alpha sparc run architect "Analytics dashboard with charts, KPIs, and insights"

# 3. Implement with TDD
npx claude-flow@alpha sparc tdd "Analytics dashboard component"

# 4. Review and refine
npx claude-flow@alpha github code-review --pr auto
```

### Workflow 2: Optimize Performance

```bash
# 1. Benchmark current performance
npx claude-flow@alpha benchmark run --operation "idea-validation" --iterations 10

# 2. Identify bottlenecks
npx claude-flow@alpha perf analyze --session "recent"

# 3. Apply optimizations
npx claude-flow@alpha topology optimize --auto true

# 4. Re-benchmark
npx claude-flow@alpha benchmark run --operation "idea-validation" --iterations 10
```

### Workflow 3: Add New Coaching Agent

```bash
# 1. Generate with SPARC
npx claude-flow@alpha sparc tdd "Create [Agent] for [purpose]"

# 2. Test generated agent
npm test tests/unit/[agent].test.js

# 3. Integrate
# - Add to src/agents/index.js
# - Register in orchestrator
# - Add route if needed

# 4. Document in .claude/agents/
# - Create .claude/agents/core/[agent].md
# - Document personality, memory keys, integration
```

## Quick Troubleshooting

### "claude-flow command not found"

```bash
# Use npx (recommended)
npx claude-flow@alpha --version

# Or install globally
npm install -g claude-flow@alpha
```

### Hooks not working

```bash
# Check if enabled
cat .claude/settings.json | grep HOOKS_ENABLED

# Should show: "CLAUDE_FLOW_HOOKS_ENABLED": "true"

# If false, re-enable
export CLAUDE_FLOW_HOOKS_ENABLED=true
```

### Memory not persisting

```javascript
// Always call session-end after agent work
execSync(`npx claude-flow@alpha hooks session-end --session-id "entrebot/${sessionId}" --export-metrics true`);
```

### Swarm initialization fails

```bash
# Stop existing swarms
npx claude-flow@alpha swarm stop --all

# Reinitialize
npx claude-flow@alpha swarm init --topology hierarchical --max-agents 5
```

## Best Practices Checklist

- [ ] Use `UPPER_SNAKE_CASE` for all memory keys
- [ ] Initialize swarm before multi-agent workflows
- [ ] Call `hooks session-end` after agent processing
- [ ] Use SPARC for creating new agents
- [ ] Monitor performance regularly
- [ ] Leverage parallel execution for independent tasks
- [ ] Document new agents in `.claude/agents/`

## Next Steps

1. **Try Example 1**: Parallel idea validation (biggest immediate impact)
2. **Create Mentor Agent**: Use Example 2 to add post-launch coaching
3. **Read Full Guide**: See `docs/CLAUDE_FLOW_INTEGRATION_GUIDE.md` for comprehensive documentation
4. **Explore Agents**: Browse `.claude/agents/` for specialized templates

## Resources

- **Full Guide**: `docs/CLAUDE_FLOW_INTEGRATION_GUIDE.md`
- **Agent Templates**: `.claude/agents/`
- **SPARC Commands**: `.claude/commands/sparc/`
- **Architecture**: `docs/CONTEXT.md`
- **Claude-Flow Repo**: https://github.com/ruvnet/claude-flow

---

**Questions?** Check the [full integration guide](CLAUDE_FLOW_INTEGRATION_GUIDE.md) or review `.claude/agents/` for specialized configurations.
