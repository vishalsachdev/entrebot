# Claude-Flow Quick Reference Card

## 🚀 Most Common Commands

```bash
# Create new agent
npx claude-flow@alpha sparc tdd "Create [Agent] for [purpose]"

# List available agents/modes
npx claude-flow@alpha sparc modes

# Monitor performance
npx claude-flow@alpha swarm monitor

# Check status
npx claude-flow@alpha swarm status
```

## 📊 Performance Gains

| Task | Before | After | Speedup |
|------|--------|-------|---------|
| Idea Validation (5 ideas) | 60s | 15s | **4x** |
| Full Journey (Pain→PRD) | 83s | 38s | **2.2x** |
| Agent Development | 2-4 hours | 5 min | **24-48x** |

## 🎯 Top 3 Use Cases

### 1. Parallel Validation
```javascript
const validations = await orchestrator.validateIdeasInParallel(sessionId, ideas);
// ⚡ 4x faster
```

### 2. Create Agent with SPARC
```bash
npx claude-flow@alpha sparc tdd "Create MentorAgent"
# ✅ Complete agent in 5 minutes
```

### 3. Auto Code Review
```bash
npx claude-flow@alpha github code-review --pr 123
# 📊 Consistent quality
```

## 📁 Documentation Map

```
docs/
├── claude-flow-quickstart.md          # Start here (5 min)
├── CLAUDE_FLOW_INTEGRATION_GUIDE.md   # Comprehensive guide
├── CLAUDE_FLOW_SUMMARY.md             # Executive summary
└── examples/
    ├── README.md                       # Usage guide
    └── claude-flow-orchestrator.js     # Working code
```

## 🔧 Integration Options

### Option 1: Drop-in Replacement
```javascript
import { ClaudeFlowOrchestrator } from './docs/examples/claude-flow-orchestrator.js';
export const orchestrator = new ClaudeFlowOrchestrator();
```

### Option 2: Gradual Migration
```javascript
// Use enhanced for new features only
const enhanced = new ClaudeFlowOrchestrator();
const validations = await enhanced.validateIdeasInParallel(sessionId, ideas);
```

### Option 3: Feature Flag
```javascript
const USE_CLAUDE_FLOW = process.env.CLAUDE_FLOW_ENABLED === 'true';
export const orchestrator = USE_CLAUDE_FLOW ? new ClaudeFlowOrchestrator() : new Orchestrator();
```

## ⚠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| Command not found | Use `npx claude-flow@alpha` |
| Hooks not working | Check `CLAUDE_FLOW_HOOKS_ENABLED=true` |
| Swarm fails | Run `npx claude-flow@alpha swarm stop --all` first |

## 📚 Learning Path

1. ✅ **5 minutes**: Read `claude-flow-quickstart.md`
2. ✅ **15 minutes**: Try parallel validation example
3. ✅ **5 minutes**: Create first SPARC agent
4. ✅ **30 minutes**: Review full integration guide
5. ✅ **1 hour**: Implement in production

## 🎓 Key Concepts

- **SPARC**: Specification → Pseudocode → Architecture → Refinement → Completion
- **Swarm**: Multi-agent coordination (hierarchical, mesh, adaptive)
- **Hooks**: Pre/post operation automation
- **Memory**: Persistent context across sessions
- **Topology**: Agent coordination pattern

## 🔗 Quick Links

- [Quick Start](claude-flow-quickstart.md)
- [Full Guide](CLAUDE_FLOW_INTEGRATION_GUIDE.md)
- [Examples](examples/)
- [Claude-Flow Repo](https://github.com/ruvnet/claude-flow)

---

**Print this page and keep it handy!**
