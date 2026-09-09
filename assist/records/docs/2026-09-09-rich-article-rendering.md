# Docs Rich Article Rendering

Date: 2026-09-09

## Outcome

Docs now renders GitHub-Flavored Markdown tables, highlighted code blocks with
copy controls, Mermaid diagrams, and repository-owned article images.

## Ownership and boundaries

The Docs API compiles Markdown and serves only approved image asset types from
safe repository paths. The Docs web module renders Mermaid flowchart syntax
through a safe Docs-owned SVG renderer and adds reader-only code controls.
Markdown and image sources remain owned by their existing repository folders.

## Decisions

- Use `remark-gfm` for Markdown tables.
- Use `rehype-highlight` for server-rendered code token classes.
- Keep Mermaid flowchart source as a fenced code block until the Docs web reader renders it.
- Resolve relative image paths through the Docs API instead of serving repository files directly.
- Store article images in an `assets` folder beside the owning document area.

## Verification

- API and web type checks and production builds cover the new rendering path.
- Browser inspection confirms the table layout, code controls, Mermaid flowchart
  container, and article image. API checks confirm highlighted code classes.
- Asset-route checks confirm a valid image can load and unsafe or unsupported paths return 404.
