# Platform Desktop

This host uses Tauri, Rust, React, shared `@codexsun/ui` exports, and public API contracts.

Rust owns the `desktop_runtime` command. It returns operating-system and package-version metadata only. The React host does not access filesystem, shell, process, or database APIs.

Use `npm.cmd run dev:desktop` for a port-checked development start. Use the root build for an unbundled desktop binary under `../../../dist/core/platforms/desktop`.

The Cargo package version mirrors the root lockstep version because Tauri requires native package metadata. Do not manage it as a separate release line.
