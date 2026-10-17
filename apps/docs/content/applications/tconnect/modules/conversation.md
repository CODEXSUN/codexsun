# TConnect: Conversation

Buyer and seller conversations linked to sourcing requirements or enquiries.

## Behavior and ownership

The conversation routes list and open threads and read or send messages. The service requires tconnect.conversation.self and checks participant ownership. Writes recheck the active participant in a transaction. Sellers can open a requirement conversation. Message submission uses strict input and an hourly limit.

Read `apps/tconnect/api/src/modules/conversation` and `apps/tconnect/web/src/modules/conversation` for current contracts.
Platform supplies trusted tenant and user context. Documentation never grants permissions.
Apply owning tenant migrations before using new tables.

## Verification

Run TConnect API/web type checks, lint, builds, boundaries, and focused ownership tests.
Verify denied participant access and cross-account isolation through configured E2E tests.
These source contracts do not certify a deployed messaging or quotation service.
