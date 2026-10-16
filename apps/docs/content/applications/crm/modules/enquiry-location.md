# Crm: Enquiry Location

Crm owns the Enquiry Location capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/enquiry-location/enquiry-location.migration.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.module.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.repository.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.routes.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.service.test.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.service.ts`
- `apps/crm/api/src/modules/enquiry-location/enquiry-location.types.ts`
- `apps/crm/api/src/modules/enquiry-location/index.ts`

## Declared routes

- `/crm/enquiries/:id/locations`
