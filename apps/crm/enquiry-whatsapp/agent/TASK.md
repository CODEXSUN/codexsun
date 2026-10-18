# Enquiry WhatsApp tasks

## Implemented

- [x] Persist Enquiry WhatsApp handoffs with the request key, recipient,
  message, actor, and UTC timestamp.
- [x] Expose tenant-authorized list and create endpoints under the Enquiry API.
- [x] Display persisted messages in the Enquiry WhatsApp tab and record the
  handoff before opening the WhatsApp link.
- [x] Verify retry idempotency, conflicting request-key reuse, recipient
  validation, permission denial, migration repeatability, and transactional
  action-history integration in the isolated database E2E.

## Remaining

- [ ] Verify live tenant migration and authorized browser use before claiming
  production behavior.
- [ ] Add a provider callback only if the product later needs actual delivery
  status; handoff records alone do not prove delivery.

Run the CRM API and web checks in the parent CRM owner guide, plus
`npm run test:e2e:crm-whatsapp`. Do not infer live or mobile verification from
these local checks.
