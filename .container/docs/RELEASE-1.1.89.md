# Hostinger 1.1.89 release preparation

Requested on 2026-11-19, Asia/Calcutta. Source baseline:
`646cef1a5caf0d95707992b5804490de6afd8362` (`1.1.88`).

The user authorized version `1.1.89`, source publication, isolated staging and
recovery checks, safe promotion of CODEXSUN on the Hostinger VPS, and conditional
removal of `/home/codexsun-releases` and `/home/codexsun-hotfixes` after all checks
pass. Local Ubuntu `192.168.1.34` is not this deployment target.

## Release scope

API, Web, Shop, Worker and Chatb must identify version `1.1.89` and the same exact
published application source revision. Existing MariaDB, Redis, Media, CXApp,
Devkit, Cloudflare and unrelated resources remain outside replacement scope.
Preserve the API's read-only Data Bridge mount and existing production identities,
credentials, tenant data and named volumes.

Version changes are lockstep metadata. This batch introduces no application
schema or permission change. Migration differences from the running older release
still require ledger review and recovery proof before production replacement.

## Required operation evidence

Follow `IMMUTABLE-PROMOTION.md` and `STAGING-PREPARATION.md`. Build published
source once, record all five immutable image digests, and test those images on
isolated staging. No production data, queues or provider credentials may be used
as a staging runtime. Verify authentication, tenant isolation, browser flows,
Worker ownership, Chatb routing, restart and rollback behavior.

Recovery must cover the actual master and tenant migration targets and preserve
storage, media, current runtime images and private configuration. Perform restore
checks only against isolated resources. Do not reuse expired `1.1.72` exception
records, claim historical backups are fresh, or fabricate acceptance receipts.

Production apply is gated by the published promoter and exclusive deployment
lock. Keep live writers running until staging, adoption and recovery preparation
are sufficient for an approved maintenance stage. Stop gracefully; never bypass
failed migration checks, run reset/seed, or automatically downgrade migrated data.

## Legacy folders

The protected archives and verification results are documented in
`LEGACY-VPS-ARCHIVE-2026-11-19.md`. Recheck those archives and detect source-folder
changes before removal. Never remove `/home/codexsun/.container/releases`, Docker
volumes, retained runtime images or current recovery records.

## Status and final evidence

This is the source release plan, not a passing staging or production receipt.
Private execution records live outside Git under the operator's protected backup
directory. Final records must identify the published source SHA, image digests,
actual checks, recovery references, running versions and any removal performed.
Failed or pending stages remain explicit. Publication alone does not prove that
production is running this version.

Source preparation passed the full `npm run check` and version consistency check.
The live registry inspection found 14 tenant database names plus the master. The
published recovery policy's two-tenant limit requires an explicit scope decision
before broader fresh database/storage captures. No expired exception was reused.

The user subsequently confirmed preserving MariaDB infrastructure while allowing
verified application backups and required migrations, with explicit priority for
Rainbow and Techmedia. The optional exact-source/image-bound recovery scope
record supports the actual registered CODEXSUN target set without changing the
two-tenant default or bypassing restore and freshness checks.

The application candidate is frozen at
`3fbc7ebcb8dbce9a28f37e812cd92fe84c169533`. Subsequent operator-only checks may
use a separately published operator revision, as required by the promotion
contract; they must not relabel or rebuild an already accepted application image.
An owned path with no files needs actual fresh inventory evidence, rather than
a fabricated archive or an implicit waiver of media recovery.
