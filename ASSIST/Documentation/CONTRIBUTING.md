# Contributing

## Required Workflow

1. Read `ASSIST/AI_RULES.md`
2. Read `ASSIST/Documentation/ARCHITECTURE.md`
3. Read the relevant discipline files under `ASSIST/Discipline`
4. Update `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` with the active reference before substantial work
5. Implement the smallest safe increment
6. Validate the affected areas with `typecheck`, `lint`, `test`, and `build` when they apply to the change
7. Update docs and changelog in the same change set with the same reference
8. Use the repository's actual scripts and standard git commands; do not depend on helper tooling that is absent from `package.json`

## Repository Rules

Always follow:

1. `ASSIST/Discipline/CODING_STANDARDS.md`
2. `ASSIST/Discipline/BRANCHING_AND_COMMITS.md`
3. `ASSIST/Discipline/REVIEW_CHECKLIST.md`
4. `ASSIST/Discipline/TESTING_POLICY.md`
5. `ASSIST/Discipline/RELEASE_DISCIPLINE.md`
6. `ASSIST/Discipline/VERSIONING_AND_RELEASES.md`

## Platform Standard

Every meaningful change should preserve the Codexsun platform direction:

1. framework stays reusable and app-agnostic
2. core stays shared and business-common
3. shared UI and UX stay in `apps/ui` so apps can stay standalone and shippable independently
4. connector and plugin behavior stays explicit
5. host composition happens through a clear composition root and DI-style registration model
6. docs must make the platform understandable without depending on private memory or AI context
7. build outputs stay under the shared root build layout
8. shared package documentation must be added under `ASSIST/Documentation` until a dedicated docs app exists
9. new modules and packages must ship with side-by-side docs in Markdown
10. framework HTTP and integration contracts must stay split by stable surface or concern instead of one catch-all file
11. root lint, formatting, and shared TypeScript behavior must be configured centrally before adding package-local overrides

## Pull Request Expectations

1. State scope clearly
2. State affected ownership boundaries: framework, core, or app-specific
3. Describe validation performed
4. Identify risks or gaps
5. Mention documentation and changelog updates
6. If code moved between app boundaries, explain why that ownership is correct
7. If a change increases host coupling, justify it explicitly or redesign it
8. Include the active reference number
9. If a change adds or changes shared presentation code, explain why it belongs in `apps/ui`
10. If a change adds database work, explain the ownership boundary and why it belongs there
