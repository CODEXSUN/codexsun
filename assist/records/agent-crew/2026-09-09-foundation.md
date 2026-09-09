# Agent Crew foundation

## Outcome

Created a new source-owned Agent Crew application. It replaces the requested
ZXA capability in this repository without importing ZXA source or Gemini.

## Bindings

The React dashboard calls the Fastify control API. The control API validates
input and forwards only scoped provider runs to the private worker using a
deployment-owned bearer token. The worker resolves workspace IDs below its
mounted root, runs Codex or OpenCode, or calls local Ollama. It records bounded
in-memory metrics and returns safe errors.

## Deployment decisions

The worker uses a dedicated Node/Python image with pinned CLI versions. The
runtime catalog supports an explicit component Dockerfile and component-owned
named volumes. The worker receives workspace and credentials volumes, has no
Docker socket, and is not a credential proxy for the dashboard.

## Preserved boundaries

The older ZXA checkout was read as reference only and was not modified or
deleted. Zetro remains independent. Provider login state is not stored in
profiles, task data, browser state, or application source.

## Verification

Pending focused type checks, builds, runtime validation, and a Docker build.
Provider execution also requires a real mounted workspace and authenticated
Codex/OpenCode or reachable local Ollama instance.
