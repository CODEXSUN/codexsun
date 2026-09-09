# Agent Crew control API module

Version: `0.1.0`
Development record: [Agent Crew foundation](../../../../../assist/records/agent-crew/2026-09-09-foundation.md)

This module owns the dashboard-facing proxy to the isolated worker. It validates
run requests and never receives, stores, or returns provider credentials.

Routes: `GET /api/agent-crew/overview` and `POST /api/agent-crew/runs`.
The worker token is a deployment secret. The worker owns provider execution,
workspace path resolution, command limits, and run metrics.

## Development records

[Agent Crew foundation](../../../../../assist/records/agent-crew/2026-09-09-foundation.md)
