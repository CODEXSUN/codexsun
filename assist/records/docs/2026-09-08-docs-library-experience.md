# Docs Library Experience

## Outcome

Docs now opens on a source-backed overview and provides search, hash deep links,
reader outlines, linked notes, backlinks, tag-related document discovery, and
separate readable styling for fenced code samples.

## Authoritative references

- Owner README: [Docs API](../../../apps/docs/api/src/modules/docs-library/README.md) and [Docs web](../../../apps/docs/web/src/modules/docs-library/README.md)
- Application catalog: [Docs module catalog](../../modules/docs.md)
- Architecture contract: [Application standard](../../architecture/application-standard.md)
- Local skills: [Web UI](../../skills/web-ui.md) and [API](../../skills/api.md)

## Ownership and boundaries

`docs.library.web` owns browser search, URL selection, reader cache, outline,
document relationship views, and Markdown reader presentation. `docs.library.api` continues to own vault
scanning and restricted MDX rendering. The source vault remains authoritative;
no documentation content was moved into a browser store or database workflow.

## Binding properties

| Producer      | Consumer  | Binding                           | Version or key                       |
| ------------- | --------- | --------------------------------- | ------------------------------------ |
| Docs API      | Docs web  | Document list and document routes | `@codexsun/docs-contracts` v1 routes |
| Docs web      | MDI shell | Controlled top-menu search value  | `MdiMain` search properties          |
| Docs renderer | Docs web  | Wiki-link hash navigation         | `#<document-slug>`                   |

## Parallel work

The repository contained unrelated uncommitted scaffold, versioning, and
changelog work. This change only extended Docs and the shared MDI search
contract and did not overwrite unrelated files.

## Decisions

- Decision: derive backlinks and related notes from the existing document list.
- Reason: it keeps the source vault authoritative and avoids a second index contract.
- Rejected alternative: add a new database-backed content or relationship system.

## Verification

- Command: Docs web, Docs API, and UI workspace type checks.
- Result: passed.
- Browser: verified overview, search filtering, hash deep-link restoration, and outline.
- Not run: MariaDB index sync and the full root verification suite.

## Follow-up work

Add CI validation for frontmatter and broken wiki-links when document governance
rules are approved.
