# Documentation Standards

## Required documentation

Each application, add-on, package, and module has a README.

The README states purpose, owner, public contracts, dependencies, configuration, storage behavior, events, local setup, and verification commands.

## Change documentation

Update local module documentation with module code. Update central Assist documentation when a change affects architecture, contracts, storage, deployment, security, or agent behavior.

Update the active entry in `CHAGELOG.md` for every meaningful completed progress change. Keep database and app-code changes separate.

## Writing rules

Use direct language and relative links. Describe current behavior and label future decisions clearly.

Do not document secrets, real credentials, private identifiers, or unsupported claims. State untested paths and known limits.

## Templates

Use the templates in `assist/templates/` for modules, decision records, deployment profiles, and app environment examples.
