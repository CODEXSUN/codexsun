# Meety Backend Module

This module owns the Meeting records and action items domain boundary.

## Contract

The module exports its provider through the package root and exposes versioned contract \`meety.v1\`. Its API boundary is defined in \`src/api.ts\`.

## Persistence

The service uses the shared add-on repository port. The current default is an in-memory repository for local development. A database adapter must implement the same port and keep migrations inside this module.

## Security

The API routes declare read and write permissions. An application composition root must attach identity and authorization before registering these routes.
