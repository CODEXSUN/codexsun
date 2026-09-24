# DOCX Repository Documentation

The documentation portal previews repository-owned Markdown directly from its source files.

## Library

- Automatically scans applications, devkits, platform, packages, Assist, tools, and root Markdown, including hidden deployment folders.
- Excludes dependencies, build output, Git metadata, and the vendored Zetro2 editor tree.
- Groups documents by application or owner, ordered alphabetically with each owner's README first.
- Uses the first level-one heading as the title; filenames distinguish duplicate titles.
- Searches headings, paths, and content. The DOCX API scans the current repository on every library refresh, so the preview updates after documentation changes without rebuilding the web bundle.

## Reader

The shared `MarkdownContent` renderer supports tables, task lists, code blocks, and Mermaid diagrams. The toolbar switches between preview and Markdown source, copies a document URL, or downloads the source. The `doc` URL query parameter preserves selection on refresh and supports browser back and forward. Links to indexed Markdown files open in the portal.

The viewer is read-only. Edit original Markdown files in the repository. There are no sample documents, simulated saves, or database copies of documentation.

## Storage and Authentication

DOCX uses the existing identity service and SQLite at `storage/devkits/docx/private/data/docx_db.sqlite`. Development startup migrates and seeds identity tables. Markdown remains on disk and does not need another database.

For Zbrowser, the API runs in the editor container and the preview proxies to `http://editor:6200`. The DOCX preview uses port 6145. Automatic login is controlled by the API's local environment configuration.

## Verification

Run the DOCX web `check`, `lint`, `test`, and `build` workspace commands. Verify automatic login through the preview host, application navigation, search, source view, document links, and live updates.
