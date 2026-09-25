# AgentCrew Web Dashboard

Connect to the local assistant, submit prompts, approve recurring work, index notes, and inspect run activity.

## Composition

The React host uses public `@codexsun/ui` layout, button, input, and textarea exports.
API requests stay on the same origin through Vite in development and Nginx in Docker.
The connection token stays in React memory and is never saved in local storage.

## Development and verification

Run the web workspace `dev`, `check`, `lint`, and `build` scripts from the repository root.
The default web port is 6411. Build output is `dist/devkits/agentcrew/web/` at the repository root.
See the [application README](../README.md) for setup and the distinction between coding advice and executable tools.
