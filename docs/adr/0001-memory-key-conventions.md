# ADR 0001: Memory Key Conventions

## Status

Accepted

## Context

VentureBot uses a multi-agent architecture where different AI agents (Onboarding, Idea Generator, Market Validator, etc.) share state through a key-value memory system stored in Supabase.

**Problem:** Without standardized naming conventions, agents may:
- Use inconsistent casing (`UserPain` vs `user_pain` vs `USER_PAIN`)
- Create duplicate keys with slight variations
- Fail to find data stored by other agents
- Break silently when memory lookups return `null`

This is the #1 cause of agent coordination failures in multi-agent systems.

## Decision

All memory keys MUST follow `UPPER_SNAKE_CASE` convention.

### Canonical Memory Keys

| Key | Owner Agent | Description | Schema |
|-----|-------------|-------------|--------|
| `USER_PROFILE` | Onboarding | User's basic info | `{ name: string }` |
| `USER_PAIN` | Onboarding | Primary pain point | `{ description: string, category?: string }` |
| `USER_PAIN_DEEP` | Onboarding | Detailed pain analysis | `{ frequency, severity, who_experiences, current_workarounds, willingness_to_pay, personal_experience }` |
| `USER_PREFERENCES` | Onboarding | Interests/activities | `{ interests?: string, activities?: string }` |
| `IDEA_COACH` | Idea Generator | Generated ideas | `[{ id: number, idea: string }]` |
| `SELECTED_IDEA` | Idea Generator | User's chosen idea | `{ id: number, idea: string }` |
| `VALIDATION_RESULTS` | Market Validator | Validation scores | `{ score: number, confidence: number, ... }` |
| `PRD_DRAFT` | PRD Generator | Product requirements | `{ title: string, sections: [...] }` |

### Naming Rules

1. **Format:** `UPPER_SNAKE_CASE` only
2. **Prefix by domain:** `USER_*`, `IDEA_*`, `VALIDATION_*`, `PRD_*`
3. **No abbreviations:** `USER_PROFILE` not `USR_PROF`
4. **Singular nouns:** `SELECTED_IDEA` not `SELECTED_IDEAS` (unless it's a list)

### Migration

Existing keys that don't follow convention:
- `IdeaCoach` → `IDEA_COACH`
- `SelectedIdea` → `SELECTED_IDEA`
- `ValidationResults` → `VALIDATION_RESULTS`

## Consequences

### Positive
- Agents can reliably find shared data
- New agents follow predictable patterns
- Debugging is easier (consistent key format)
- Documentation is clearer

### Negative
- Breaking change for existing data (requires migration)
- Slightly more verbose than camelCase

### Neutral
- Requires updating agent prompts to use new keys
- Need to document all keys in CONTEXT.md
