# DOCX Web

DOCX provides a searchable Markdown library grouped by application, devkit, platform, package, and documentation owner.

## Documentation

The [repository documentation module](src/modules/documentation-portal/README.md) owns discovery, navigation, Markdown previews, source view, and document links. Follow the [documentation standards](../../../assist/documentation/standards.md) when adding or updating files.

## Runtime

Run `npm run dev:docx-api` and `npm run dev:docx-web` from the repository root. Local defaults are API port 6200 and web port 6201. Zbrowser serves the DOCX preview on port 6145 and connects to the API in the editor container.

Run the workspace `check`, `lint`, `test`, and `build` commands before handoff.
