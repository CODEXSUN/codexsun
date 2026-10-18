# Enquiry WhatsApp plan

## Ownership

The Enquiry WhatsApp leaf owns the durable audit record for messages prepared
from an Enquiry. Enquiry remains the owner of contact/mobile identity and
record visibility. Platform authentication supplies the actor. The browser
hands off to the WhatsApp URL after successful persistence; it does not own the
audit row or assert delivery.

## Delivery sequence

1. Add the additive, repeatable tenant migration and register it in CRM's
   tenant migration plan.
2. Add list/create contracts with strict input validation, saved-mobile
   recipient resolution, Enquiry visibility checks, and actor/request
   idempotency.
3. Integrate the tab and refresh its history after a successful write.
4. Verify with the isolated database E2E, CRM boundaries, API/web typechecks,
   lints, and production builds. Verify live tenants separately before rollout
   is described as complete.

## Data and compatibility

The migration only adds `crm_enquiry_whatsapp_messages` and a restrictive
foreign key to `crm_enquiries`. It does not rewrite or delete existing Enquiry
records. The API response exposes the saved sender identity and can resolve a
display name from the tenant's user table. The request key is unique per actor;
retries with changed recipient or message are conflicts.
