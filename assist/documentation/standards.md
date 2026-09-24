# Documentation Standards

Defines documentation structure, ownership, and update requirements for CODEXSUN.

## Required documentation

Each application, add-on, package, and module has a README.

The README states purpose, owner, public contracts, dependencies, configuration, storage behavior, events, local setup, and verification commands.

## Change documentation

Update local module documentation with module code. Update central Assist documentation when a change affects architecture, contracts, storage, deployment, security, or agent behavior.

Update the active entry in `CHAGELOG.md` for every meaningful completed progress change. Keep database and app-code changes separate.

## Writing rules

Start every repository-owned Markdown file with a single descriptive `# Title` as the first nonblank line. Follow it with a brief purpose statement and use `##` and `###` for sections. Do not put badges, decorative separators, sample text, or navigation before the title. Preserve upstream documentation as supplied by its owner.

DOCX scans application, devkit, platform, package, Assist, tool, and root Markdown files automatically. The first heading labels each document in its application group. Keep filenames stable and use relative Markdown links; no manual document registration is needed. The DOCX API reads current source files on each library refresh; deployed viewers require the repository Markdown to be available to the API.

Use direct language and relative links. Describe current behavior and label future decisions clearly.

Do not document secrets, real credentials, private identifiers, or unsupported claims. State untested paths and known limits.

## Templates

Use the templates in `assist/templates/` for modules, decision records, deployment profiles, and app environment examples.
