# Framework API Boundary And Integration Foundation

## Purpose

This plan defines the framework-owned HTTP and integration foundation that matches the real `apps/` repository model.

Use this plan when adding:

1. framework-owned API namespaces
2. route policy and request-context contracts
3. API client, token, idempotency, webhook, and request-log tables
4. public docs for framework HTTP and integration behavior

## Goal

Implement a framework-owned API boundary with three clear surfaces:

1. an internal API for first-party apps, desks, and workspace flows
2. an external API for client apps, partner apps, and third-party systems
3. a small public API surface for setup, health, and future unauthenticated bootstrap endpoints

## Current Reality

Implemented now:

1. internal route surface under `apps/api/src/internal`
2. external route surface under `apps/api/src/external`
3. framework HTTP route assembly under `apps/framework/src/runtime/http`
4. internal endpoints `/internal/apps` and `/internal/baseline`
5. external endpoint `/api/apps`
6. public health endpoint `/health`

Not implemented yet:

1. versioned namespaces such as `/internal/v1`, `/external/v1`, and `/public/v1`
2. request-context policy and auth contracts
3. API client, token, idempotency, and webhook persistence
4. public bootstrap routes beyond health

## Execution Plan

1. define versioned framework API namespaces and contract rules
2. add framework-owned route policy, request-header, request-context, and route-manifest helpers under `apps/framework/src/runtime/http`
3. add API-client and request-safety persistence ownership once migration tooling is active
4. publish public framework docs for the HTTP boundary and integration database ownership under `ASSIST/Documentation`
5. validate with `typecheck`, `lint`, `test`, and `build`
