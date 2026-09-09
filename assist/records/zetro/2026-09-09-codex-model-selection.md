# Zetro Codex Model Selection

Date: 2026-09-09

## Outcome

Zetro now shows one compact Codex selector in the workspace context bar. The
selector replaces the static Provider and Model labels.

Users can select Default, GPT-6 Astra, GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6
Luna, GPT-5.5, or GPT-5.3 Codex Spark. Users can also select Light, Medium, or
Hard reasoning.

## Authoritative references

- Application README: `apps/zetro/README.md`
- Desk owner: `apps/zetro/web/src/modules/desk/README.md`
- Agent Chat owner: `apps/zetro/web/src/modules/agent-chat/README.md`
- Settings owner: `apps/zetro/web/src/modules/settings/README.md`
- Chat API owner: `apps/zetro/api/src/modules/chat/README.md`
- Codex connection owner: `apps/zetro/api/src/modules/codex-connection/README.md`

## Ownership and bindings

The Settings module stores the model and reasoning preferences. Agent Chat adds
them to each new response request. The Chat API validates the values. The Codex
connection applies the model at `thread/start` and the effort at `turn/start`.

Light maps to `low`. Medium maps to `medium`. Hard maps to `high`. Default omits
the model and uses the Codex account or `ZETRO_CODEX_MODEL` value.

The desktop application uses the same Zetro web bundle and API contract. It does
not own a second model selector.

## Parallel work

The worktree contained separate Orship and Zetro Task changes. This change did
not edit those owners. The module catalog update preserved their version rows.

## Verification

- `npm.cmd run test --workspace @codexsun/zetro-api`: Passed.
- `npm.cmd run test --workspace @codexsun/zetro-web`: Passed.
- Zetro API and web type checks and lint: Passed.
- Zetro API build: Passed.
- `npm.cmd run build --workspace @codexsun/zetro-web`: Passed.
- The Zetro web production chunks stayed below 400 KB.
- Documentation, file length, workspace, version, and build output checks: Passed.
- Module dependencies: Blocked by the concurrent Tasks `^0.4.0` binding to version `0.5.0`.
- A live Codex turn with each model did not run.
- A packaged desktop visual check did not run.
