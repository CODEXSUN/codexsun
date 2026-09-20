# Architecture

## Purpose

This guide defines the intended structure of the CODEXSUN repository.

Read the [tech stack plan](tech-stack.md) for selected technologies and delivery order.

Read the [module architecture](module-architecture.md) for the repository composition model.

Read the [application catalog](application-catalog.md) for host and add-on selection.

Read the [contracts and events guide](contracts-and-events.md) for public integration rules.

Read the [shared capabilities guide](shared-capabilities.md) for cross-application provider ports and their implementation boundaries.

Read the [deployment database topology](deployment-database-topology.md) for master and application database ownership.

## Repository layout

- `apps/` contains independently deployable applications.
- `packages/` contains reusable code with a named owner and public API.
- `tools/` contains development and repository tooling.
- `assist/` contains architecture, documentation, and execution guidance.

## Application structure

Each application may contain these parts:

- `api/` for server-side APIs, jobs, and persistence adapters.
- `web/` for browser-facing user interfaces.

An application owns its domain behavior. It must not depend on another application's internal files.

## Package structure

Packages expose stable public interfaces. Applications import packages through those interfaces only.

`packages/framework` provides runtime-neutral foundation code. `packages/platform-core` provides platform composition code. `packages/ui` provides reusable user-interface components.

## Current decisions

The folders describe the initial target structure. Exact Node.js version, package manager, deployment profile, and public API details remain decision gates.

Record a reviewed architectural decision in a new document in this folder before it affects multiple applications or packages.
