# Projex Workspace Module

This module reads the repository catalog, local app configuration, runtime ports, and owned documentation for the Projex dashboard.

## Contract

The module publishes `GET /api/v1/projex/workspace`. The route requires an authenticated Projex session.

## Ownership

Projex reads registry and documentation metadata. It does not import private code from an app or devkit and does not mutate another application.
