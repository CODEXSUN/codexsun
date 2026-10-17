# TConnect: Message

Messages preserve the history of private buyer and seller conversations.

## Behavior and ownership

The message module owns message routes, validation, persistence, and sender checks.
Messages remain immutable within their conversation history.
Platform supplies trusted tenant and signed-user context. Request data cannot grant participant access or choose a sender identity.

Read `apps/tconnect/api/src/modules/message` for the current contracts.
The conversation workspace consumes message operations through its public transport.
Apply TConnect tenant migrations and the applicable participant permissions before using these routes.

## Verification

Run the TConnect tests and configured negotiation E2E suite.
Verify unauthorized participants cannot read or send messages in another conversation.
Source presence does not certify deployed delivery or external notifications.
