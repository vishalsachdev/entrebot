# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the VentureBot project.

## What is an ADR?

An ADR is a short document that captures an important architectural decision along with its context and consequences. ADRs help teams:

- Remember why decisions were made months or years later
- Onboard new developers who can quickly understand the reasoning
- Avoid repeating the same debates when someone questions an existing decision
- Track evolution of the system over time

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](./0001-memory-key-conventions.md) | Memory Key Conventions | Accepted | 2025-11-30 |

## Creating a New ADR

1. Copy `template.md` to `NNNN-title-with-dashes.md`
2. Fill in the sections
3. Add entry to the index above
4. Submit PR for review

## For AI Agents

When making architectural changes:
1. Check existing ADRs for relevant decisions
2. If your change contradicts an ADR, discuss before proceeding
3. Create a new ADR for significant architectural decisions
4. Update the index in this README
