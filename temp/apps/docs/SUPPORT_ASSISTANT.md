# Support Assistant Integration

## Purpose

Codexsun now includes an optional `orekso` support-assistant runtime that can index approved Codexsun knowledge, answer operator questions through Ollama, and surface help directly inside the web application.

## Codexsun Responsibilities

Codexsun owns:

1. the curated support-ingestion boundary
2. the machine-readable support knowledge manifest
3. the shared API bridge used by the web app
4. the floating Orekso assistant widget

## Runtime Surface

### Knowledge discovery

```text
GET /support/knowledge-manifest
```

This route tells Orekso which paths are recommended, which paths are excluded, and which support-risk rules must be respected.

### Assistant bridge

```text
GET /support/assistant/status
POST /support/assistant/chat
POST /admin/support/assistant/reindex
```

The public routes allow the web UI to read assistant state and ask support questions.

The admin route is super-admin-only and triggers a background reindex against the approved Codexsun knowledge set.

## Orekso Sidecar

The optional sidecar lives in:

```text
apps/orekso/server
```

The container stack lives in:

```text
.container/orekso.yml
```

That stack runs:

1. `qdrant`
2. `ollama`
3. `orekso`

Orekso reads Codexsun's knowledge manifest, scans only approved workspace paths, embeds chunks with Ollama, stores vectors in Qdrant, and answers chat requests through the shared API bridge.

## Required Runtime Keys

Set these in Codexsun runtime `.env`:

```text
OREKSO_ENABLED=true
OREKSO_URL=http://orekso:3011
```

If Orekso is disabled, the floating assistant widget stays hidden and the support assistant routes return a disabled status.

## Safety Boundary

The canonical support-ingestion contract remains:

```text
ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md
```

Use that file when changing indexing rules, approved source roots, or support-answer behavior.
