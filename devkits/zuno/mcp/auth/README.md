# Authentication and RBAC

Every MCP request is authenticated by Zuno's existing `Authorization` bearer token and `X-Codexsun-Browser-Session` header. Tokens are browser-session-bound and session expiry or logout denies subsequent tool calls.
