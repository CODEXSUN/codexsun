# Platform Web Identity Module

This module owns the Platform web session boundary.

`provider.tsx` declares the module ID and owner. It exports the session provider
for the Platform web composition root.

`IdentitySessionProvider` keeps a signed JWT bearer token in React memory.
It does not use local storage, session storage, cookies, or browser-visible
environment values for tokens.

The provider checks a token through `GET /api/v1/identity/actors/me`. It stores
the resolved public `Actor` contract and provides authenticated fetch calls.
The token stays private to the provider.

This module does not issue tokens or provide a login form. A later Identity
task will add a reviewed credential flow that calls `start()`.
