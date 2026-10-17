# TConnect: Credential

The credential module owns company evidence records and staff review state.

## Routes and access

- `GET /public/tconnect/credential` returns the permitted public credential projection.
- `GET /tconnect/credential` requires `tconnect.credential.view`.
- `POST /tconnect/credential` and `PUT /tconnect/credential/:uuid` require `tconnect.credential.manage`.

Buyer and member accounts cannot use staff review operations.
Approval requires a confirmed evidence review and an unexpired validity date.
Public responses omit private notes and reviewer identity.
Sample profile badges remain labelled examples and do not establish a completed certification review.

## Persistence and verification

Read `apps/tconnect/api/src/modules/credential` and the matching web module for current contracts.
Credential writes validate the company, reject duplicate references, and append activity within a transaction.
Apply the tenant credential migration and permission seeds before rollout.
Run TConnect tests, type checks, lint, and builds. Verify denied staff access and public-field filtering.
Repository checks do not verify the authenticity of external credential evidence.
