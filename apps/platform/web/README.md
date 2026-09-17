# Platform Web

The Platform web host composes public `@codexsun/ui` exports and Platform API
contracts.

The web Identity module keeps a verified JWT bearer token only in React memory.
It loses the session when the page reloads. It does not persist tokens in web
storage or expose them through Vite environment values.

The current host has no login form or token issuance flow. A later Identity
task must add that reviewed credential flow before users can start a session.
