# Sites: Site Enquiry

The Site Enquiry leaf exposes the client enquiry inbox through authenticated Sites routes.

## Contracts and access

`GET /sites/:uuid/enquiries` lists enquiries. A reference-specific GET returns details.
`PUT /sites/:uuid/enquiries/:reference/status` changes status. POST delete and restore routes retain revision checks.
The injected access contract supplies the trusted tenant and actor after checking view, update, or delete authority.
List and detail responses use `Cache-Control: no-store`.

## Ownership and verification

Read `apps/sites/api/src/modules/site/enquiry` for the connection, schemas, service, repository, migration, and routes.
This leaf connects authenticated Sites access to the selected client enquiry store.
Verify wrong-site denial, revision conflicts, status changes, delete/restore behavior, and retained data with a test site.
Run Sites and Platform API type checks, lint, and builds.
Source presence and compilation do not certify a deployed inbox or a live migration.
