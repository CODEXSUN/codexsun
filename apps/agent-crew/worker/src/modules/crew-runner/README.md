# Agent Crew runner module

Version: `0.1.0`  
Development record: [Agent Crew foundation](../../../../../assist/records/agent-crew/2026-09-09-foundation.md)

This private worker module owns provider execution and short-lived run metrics.
It supports only Codex CLI, OpenCode CLI, and a local Ollama HTTP endpoint.
Workspace IDs are validated before a mounted directory is used. The API process
can call it only with the deployment-owned runner token.
