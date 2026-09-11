# CXZ Provider Runtime

## Decision

Zetro may select local Codex or CXZ Codex without changing the chat contract. CXZ is a dedicated chat-only Docker runtime. It keeps one warm Codex app-server process, streams activity and response events as NDJSON, forwards stop requests, and preserves Codex thread identity across Zetro API restarts. The same container serves a small React control page for device login, live provider details, and explicit connection confirmation through Zetro.

## Ownership and boundaries

- `apps/zetro/cxz` owns the private Codex HTTP adapter and control page.
- CXZ exposes a narrow same-origin provider-selection proxy so its control page does not call the Zetro API across browser origins.
- The CXZ control page polls the confirmed provider selection. Zetro model and reasoning changes appear automatically while an unsaved CXZ draft remains protected.
- The Zetro chat header exposes provider, model, and supported reasoning selectors. Its confirmed state is an icon-only indicator with an accessible label.
- CXZ supplies a runtime-owned developer instruction when it starts or resumes a Codex thread. Identity replies name CXZ plus the active model and configured reasoning label; they do not expose private reasoning.
- Zetro's local Codex client applies the equivalent identity contract, so both selectable providers report their configured model and reasoning label consistently.
- Zetro answers direct runtime, provider, model, and reasoning questions from the active persisted connection. This diagnostic response remains accurate when model history contains an older self-description.
- `apps/zetro/api/src/modules/providers` owns persisted selection and account metadata.
- `apps/zetro/api/src/modules/chat` owns provider-neutral conversation execution.
- `packages/ui` owns the compact provider/model switcher presentation.
- `.container/docker/Dockerfile.cxz` owns the hardened CXZ image.

CXZ mounts only a credential volume. It does not mount a repository, accept file operations, expose Git and task actions, or include alternate provider adapters.

## Security and recovery

The runtime is internal to the deployment assembly. Codex runs read-only from `/tmp` with approval disabled. Credentials stay outside the image in `zetro-cxz-credentials`. Restarting CXZ preserves authentication. Zetro SQLite preserves the selected connection, model, reasoning effort, conversation ID, and provider thread ID.

## Verification

- Build contracts, CXZ, API, shared UI, and web.
- Run CXZ route/stream tests and Zetro API persistence tests.
- Validate runtime catalog and generated Compose assembly.
- Build the CXZ image and verify `/health`.
- Start device login and verify model discovery only with user-completed authentication.
- Verify the React control page, device-code copy action, activation shortcut, account state, model catalog, explicit Set connection action, and confirmed banner.
