# DOCX API

The API exposes typed Zod routes and a protected internal OpenAPI reference.

## Repository Documentation

Authenticated `GET /api/v1/docx/documents` returns Markdown paths and contents from the repository. Each request scans root documents and the apps, devkits, core, packages, assist, and tools directories, excluding dependencies, build output, Git metadata, and the vendored Zetro2 editor. Start the API through its workspace command so the repository root resolves from the API working directory.
