# Decisions

This file records the decisions that keep Zetro coherent.

## D1: Build Capability Parity, Not Source Parity

Decision:

Use Claude Code as a capability reference only. Do not copy source into Zetro without license clearance.

Reason:

The local Claude license says all rights reserved. Zetro must be Codexsun-owned.

## D2: Terminal First, Dashboard Backed

Decision:

Build terminal behavior first, while keeping dashboard visibility.

Reason:

The terminal is the fastest path to agent-like workflows. The dashboard is the right place for audit, catalog, runs, findings, guardrails, and settings.

## D3: Manual Runner First

Decision:

Zetro starts in manual mode.

Reason:

Command execution without persistence and approval is the wrong order.

## D4: Persistence Before Automation

Decision:

Persist playbooks, runs, events, findings, guardrails, and settings before adding live execution.

Reason:

Every future action must be auditable.

## D5: Model Provider After Manual Run Console

Decision:

Do not wire an LLM provider until the run console and persistence model exist.

Reason:

Model output needs a stable place to land, reload, review, and audit.

## D6: Model Optional, Provider Pluggable

Decision:

Zetro must work without a model provider. The provider order is `none`, then local Ollama, then paid hosted providers such as OpenAI or Anthropic, then custom OpenAI-compatible endpoints.

Reason:

The agent behavior should be Zetro-owned: playbooks, output modes, run history, findings, guardrails, approval gates, and terminal UX. Models are replaceable reasoning engines, not the core product. Local Ollama is the first model adapter because it is the safest free/local path for experimentation. Paid providers stay opt-in through environment-backed settings.

Guardrail:

Model output may create plans, summaries, findings, and command proposals only. It must not write files or execute commands directly.
