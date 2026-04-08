# Phase 8 Stage 8.4: Production Env And Secret Checklist

## Goal

Make the environment and secret signoff explicit for go-live.

## Dedicated Command

- `npm.cmd run test:release:env`

## Covered Checks

The validator reads the current `.env` through the shared runtime config and fails on release blockers for:

1. production-like environment selection
2. TLS enabled
3. non-local app and frontend domains
4. MariaDB production database target
5. secret owner, operations owner, and last-rotation evidence
6. SMTP sender and credentials
7. Razorpay live credentials plus webhook secret
8. backups enabled and off-machine backup destination configured
9. alert delivery target configured

It also reports warnings for empty admin or internal API IP allowlists.

## Acceptance Rule

Stage `8.4` passes only when the dedicated env command exits cleanly against the intended release `.env`.

## Boundaries

- the command masks secret values by only reporting presence or absence
- the command validates runtime readiness, not external provider business-side approvals
- if the current workstation `.env` is still a development profile, the command should fail until release values are supplied
