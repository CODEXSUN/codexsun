# ZXA

ZXA is the minimal Codex CLI adapter for Zuno. It owns a non-root Codex CLI installation and its persistent login volume. Zuno can register the agent, request a device code, and read its connection state. Zuno never receives the stored Codex credential.

## Local start

1. Copy `.env.example` to `.env` and use the same bootstrap and control keys configured in Zuno.
2. Run `docker compose up --build` from this directory.
3. Open `http://127.0.0.1:7210`, paste the local control key, and select **Connect Codex**.

The browser code is transient. The Codex session is retained only in the `zxa-codex-home` Docker volume. The console is bound to loopback; use Zuno's authenticated agent endpoints for normal operation.

This slice is only the connection adapter. It does not yet accept or execute coding assignments; that follows after the Zuno-to-CXForge lease protocol is complete.
