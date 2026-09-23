# Zuno MCP Gateway

Zuno is the only approved agent gateway for Code-server. The gateway authenticates the existing browser-bound Zuno session, resolves registry-owned workspaces, enforces role policy, and writes an audit event for every allowed or denied request.

The HTTP endpoint is `POST /api/v1/zuno/mcp`. It implements MCP JSON-RPC initialization, tool discovery, resource discovery, and tool calls. It never accepts an absolute workspace path.

Roles: users inspect registry data, approved files, and tests; admins can edit an application owner and use non-destructive operations; super-admins can manage registry installation, uninstall, and confirmed migrations. Writes, creation, installation, disable, uninstall, and migrations require `confirmed: true`. Production migrations additionally require `productionApproved: true`.
