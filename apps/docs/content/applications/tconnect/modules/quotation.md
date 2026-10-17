# TConnect: Quotation

Seller quotations attached to participant conversations.

## Behavior and ownership

The quotation routes list, create, and withdraw quotations. The service requires tconnect.quotation.self. Only registered sellers can create or withdraw quotes. Creation validates totals and UTC validity dates, locks the participant conversation, and checks its linked requirement or enquiry. Changes record transactional activity.

Read `apps/tconnect/api/src/modules/quotation` and `apps/tconnect/web/src/modules/quotation` for current contracts.
Platform supplies trusted tenant and user context. Documentation never grants permissions.
Apply owning tenant migrations before using new tables.

## Verification

Run TConnect API/web type checks, lint, builds, boundaries, and focused ownership tests.
Verify denied participant access and cross-account isolation through configured E2E tests.
These source contracts do not certify a deployed messaging or quotation service.
