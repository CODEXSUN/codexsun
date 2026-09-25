# Sites Content Module

This module owns editor-controlled public client content and section templates.

## Storage

Content is stored in the Sites SQLite database as published JSON documents in
the `sites_public_content` table. Records include reusable sections, contact
details, location, social links, footer tagline, and copyright text. The
public API exposes read-only content routes. Client-facing pages do not
receive mutation controls.

## Verification

Run the Sites API tests from the repository root with `npm run test:sites`.
