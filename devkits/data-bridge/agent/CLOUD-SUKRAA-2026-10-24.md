# Cloud SUKRAA migration verification — 2026-10-24

## Approved pair and scope

Source: `sukraa_db`. Registered SUKRAA target: `sukraa_v2_db` on `cxapp-mariadb`.
Read source data only. Import missing business data in Common, Masters, then Billing order.
Preserve target identities, extra records, valid companies, contacts, financial years, and child records.
Reuse existing hyphen lookup, product, and work-order defaults. Keep India as the country default.
Correct only the approved placeholder product unit and default company through fingerprinted correction plans.

## Recovery and rehearsal

Verified full source and target backups through disposable restores and normalized SQL comparison.
A fresh backup also includes Platform metadata. Both business databases still matched the rehearsal snapshots before live writes.
The corrected disposable rehearsal verified 137 invoices and 521 item rows, with zero warnings and orphan references.

## Deployment and live work

The initial VPS inventory still showed 1.1.54 containers and an older release source build context.
Build 1.1.55 from commit `61710dd91c9716b767101e47b0e289b2cc2e8ce0` and verify image revision labels.
Replace only CODEXSUN API and web. Preserve Shop, legacy services, infrastructure, databases, media, and credentials.
The authenticated external Chrome page now shows 1.1.55. Database Settings and Data Bridge load without the HTML/JSON error.
Save the current server source, choose `sukraa_db`, and verify the exact registered target.
Start the missing-only business import through the authenticated browser.

The initial live run is still under verification. Do not interpret rehearsal success as final production acceptance.
Final corrections, repeat audit, source preservation proof, and report results will be appended after completion.

## Code and checks

Expose the existing authenticated Core Masters audit operation from Master Tables.
Use the saved verified connection pair and existing report navigation.
Keep existing-row corrections separate from missing-only import.

Passed: 38 focused Core/CRM/Platform tests, Core API, CRM API/web, Platform API, and Data Bridge web typechecks.
Data Bridge web lint passed. The deployment build passed API and web compilation.
Pending ecommerce and Codeit changes remain outside this release.
