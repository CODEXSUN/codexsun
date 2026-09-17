# Documentation Workspace

`DocumentationWorkspace` is the shared MDI shell for documentation and knowledge applications.
It supplies Docs identity, search, sidebar persistence, status, and workspace defaults while the
owning application supplies navigation, content, settings, topology, and data loading.

Import it from `@codexsun/ui/layouts/documentation-workspace`. Do not put document persistence,
repository discovery, editing, or application routes in this package layout.
