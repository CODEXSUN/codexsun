# Zetro Development and Documentation Workflows

## Outcome

Zetro now gives each Codex task an explicit development, documentation, review, or test workflow. The selected workflow controls task instructions and appears in the saved execution summary.

## Authoritative references

- Owner READMEs: Zetro chat web, chat API, and Codex connection API
- Application catalog: `assist/modules/zetro.md`
- Architecture contract: `assist/architecture/application-standard.md`
- Local skills: API, web, code style, technical writing, and UI design

## Ownership and boundaries

The chat web module owns workflow selection and browser preference storage. The chat API validates the workflow and returns it with execution data.

The Codex connection module owns workflow instructions. The Platform and framework packages do not own Zetro behavior.

## Binding properties

| Producer         | Consumer         | Binding                  | Version or key        |
| ---------------- | ---------------- | ------------------------ | --------------------- |
| Zetro chat web   | Zetro chat API   | `workflow` request field | `0.3.0`               |
| Zetro chat API   | Codex connection | `CodexWorkflow`          | `0.3.0`               |
| Browser storage  | Zetro chat web   | selected workflow        | `zetro.chat.workflow` |
| Codex connection | Zetro chat web   | execution workflow       | `0.3.0`               |

## Parallel work

The repository had unrelated modified and untracked files. This change touched only Zetro workflow code, tests, and owned documents.

## Decisions

- Decision: Use four explicit workflows with one common safety contract.
- Reason: Each task needs a clear completion and verification policy.
- Rejected alternative: Keep one generic prompt for all coding and documentation work.

## Verification

- Command: `npm.cmd run test:zetro`
- Command: Zetro API and web type checks and builds
- Command: Repository lint, format, line, module documentation, and diff checks
- Not run: A destructive or publishing workflow

## Follow-up work

Add a production-artifact lifecycle E2E test when the release runtime is available.
