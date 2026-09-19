# Sites Agent Skills

Work only inside apps/sites unless a public platform or framework contract requires a reviewed change.

Keep product modules owned by Sites. Use shared UI, identity, and platform contracts instead of copying them.

Run dependency installation from the repository root only. Do not create app-local node_modules, dist, or .turbo folders.

Verify the affected API and web hosts. Run node tools/check-root-layout.mjs before completion.
