# DevKit Project Registry

## Outcome

Created DevKit and its first module: a JSON-backed project registry with
explicit development confirmation. The registry now uses the reusable shared
table block for its top-level project list.

The registry now supports a project-to-submodule hierarchy and the module
profile specification screens required for development planning.

## References and ownership

- API owner: [Project Registry API](../../../apps/devkit/api/src/modules/project-registry/README.md)
- Web owner: [Project Registry web](../../../apps/devkit/web/src/modules/project-registry/README.md)
- Reference pattern: DevKit project routing and CXApp JSON registry structure; no external source is imported.

## Bindings

| Producer               | Consumer   | Binding                                                            |
| ---------------------- | ---------- | ------------------------------------------------------------------ |
| DevKit API             | DevKit web | `@codexsun/devkit-contracts` and `/api/devkit/v1/project-registry` |
| UI table block         | DevKit web | `@codexsun/ui/blocks/table`                                        |
| JSON store             | API module | `DEVKIT_REGISTRY_PATH`                                             |
| Registry node upserts  | DevKit web | `/api/devkit/v1/project-registry/nodes`                            |
| Module profile upserts | DevKit web | `/nodes/:id/profile/:section`                                      |

## Decisions

- Keep the first registry JSON-backed to prove module ownership and recursive planning behavior before approving database persistence.
- Require confirmation per node rather than inferring readiness from task status.
- Keep table behavior generic in `packages/ui`; DevKit owns only project columns,
  filters, creation, and confirmation actions.
- Keep RegistryNode as the only planning entity. The shared UI table does not
  know hierarchy rules, profile fields, or DevKit workflows.
- Seed the DevKit → Identity → User → User endpoint spine through an idempotent
  service upsert, not a one-time demo file.

## Verification

- DevKit contracts, API, and web type checks passed.
- DevKit API and web production builds passed with all chunks below 400 KB.
- Application and module documentation gates, file-length check, ESLint, and
  `git diff --check` passed.
- Browser verification confirmed six-level drill-down, the delivery-leaf view,
  and the confirmation action.
- The `registry-confirmation` node persisted as `approved` in DevKit JSON storage.
- Refactored the planning workspace to Tailwind-first presentation. Custom CSS
  is limited to root document sizing.
- Removed the sample planning hierarchy and its confirmation state. A new
  DevKit registry now opens blank until real project entries are added.
- Added a reusable TanStack/shadcn table surface with search, filters, column
  visibility, totals, pagination, and row confirmation actions.
- Replaced every remaining DevKit profile table with the shared table block.
  The block now supports compact section rendering without local table markup,
  while DevKit retains its profile fields, entries, and edit callbacks.
- Added validated JSON-backed project creation and confirmed invalid create
  requests return HTTP 400 without changing the registry.
- Added guarded Project → App → Module Group → Module → Submodule navigation,
  node upserts, and unlimited submodule depth.
- Made every registry-row name a keyboard-accessible drill-down link to its
  inner table.
- Made the optional branch pattern explicit with child counts and a visible
  Children panel in each module profile. A module can stay a leaf or contain
  recursive submodules without changing its type or losing its profile.
- Added tabbed module profiles for Database, Routes, Files, Actions, Events,
  and Planning, with profile-entry upserts.
- Completed the seeded User endpoint as a leaf profile: Info now describes its
  metadata and every specification tab contains identity endpoint planning
  details. The seed is idempotent and preserves user entries. The tab strip and
  panels use short reduced-motion-safe Tailwind transitions.
- Expanded the User endpoint Info tab with an editable, JSON-backed demo
  information dataset, a full module-information record, and registry metadata.
  This uses the new `info` profile section without adding a separate drill-down.
- Replaced recursive submodules with terminal modules. The enforced path is
  Project → App → Module Group → Submodule Group → Module → Profile. Existing
  User and User endpoint records migrate in place into the group/module roles,
  so the completed User endpoint opens its profile directly.
- Trimmed the separate User endpoint node. Its profile data now belongs to the
  terminal User module. Added Role, Permission, User role, and Role permission
  terminal profiles under Identity → Access control with editable dummy
  information and specification entries.
- Migrated the existing registry record without deleting existing nodes, then
  seeded DevKit → Identity → User → User endpoint and its `GET /identity/users/:id`
  planning route.
- Not run: full root check and production-artifact lifecycle E2E coverage for DevKit.
