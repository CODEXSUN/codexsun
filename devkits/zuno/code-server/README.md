# Zuno Code-server Integration

Run one Code-server container per registry-owned workspace. The Zuno reverse proxy authenticates the browser before forwarding to the editor; the editor itself has no public password and must never be exposed directly. Configure its proxy address with `ZUNO_CODE_SERVER_URL` so the Zuno side menu can open it.

Set `WORKSPACE_OWNER` only to a manifest owner under `apps/`, `devkits/`, `packages/`, `core/platforms`, or `core/registry`. The compose file validates the value before startup, mounts the source repository read-only at `/repository`, and opens only Zuno-provisioned workspace storage at `/home/workspace`. Its internal-only network is for the authenticated platform proxy, and it drops Linux capabilities with CPU, memory, and process limits. Do not mount the host root, Docker socket, secrets, or unrelated repositories.

Install the bundled Zuno extension through the controlled image build only. Its MCP requests use the existing Zuno platform session and do not store credentials.
