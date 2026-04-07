# Phase 1 Stage 1.5 Security And Operations Policy

## Scope

This document records the Stage `1.5` baseline policy for:

- HTTPS enforcement
- secret rotation ownership
- environment segregation
- internal and admin access policy
- observability defaults
- backup and audit control ownership

Runtime-facing values are implemented through the Core Settings screen and `.env`-backed runtime settings.

## Environment Segregation

### Allowed Environments

- `development`
- `staging`
- `production`

### Policy

1. `development` may use local domains, debug OTP, and local-only credentials.
2. `staging` must use production-like domains, TLS or trusted edge TLS, and non-development secrets.
3. `production` must follow the same runtime rules as `staging`, with production-only credentials and operator-controlled access.
4. `staging` and `production` values must not share the same secret material, payment credentials, SMTP credentials, or database targets.
5. Runtime ownership must stay explicit through:
   - `SECRET_OWNER_EMAIL`
   - `OPERATIONS_OWNER_EMAIL`

## Secret Rotation

### Required Settings

- `SECRET_ROTATION_DAYS`
- `SECRETS_LAST_ROTATED_AT`
- `SECRET_OWNER_EMAIL`
- `OPERATIONS_OWNER_EMAIL`

### Policy

1. JWT, SMTP, Razorpay, and connector credentials rotate on the configured cadence.
2. Rotation evidence is recorded by updating `SECRETS_LAST_ROTATED_AT`.
3. Secret changes must be applied independently in `staging` before `production`.
4. Secret values must not be reused across environments after rotation.

## Access Policy

### Required Controls

- `INTERNAL_API_ALLOWED_IPS`
- `ADMIN_ALLOWED_IPS`

### Policy

1. Internal admin routes may be restricted by internal API allowlist.
2. Admin actors may be further restricted by admin-only IP allowlist.
3. Allowlist entries may use exact IPs or CIDR ranges.
4. Empty allowlists mean open access for that policy layer.
5. Enforcement applies at runtime through internal route auth checks.

## Session And Login Baseline

### Runtime Fields

- `AUTH_MAX_LOGIN_ATTEMPTS`
- `AUTH_LOCKOUT_MINUTES`
- `ADMIN_SESSION_IDLE_MINUTES`

### Policy

These values are now governed centrally through runtime settings. Full enforcement beyond current route/IP controls continues in later `1.5.x` tasks.

## Observability Baseline

### Runtime Fields

- `APP_LOG_LEVEL`
- `OPS_ALERT_EMAILS`
- `OPS_ALERT_WEBHOOK_URL`
- `ALERT_CHECKOUT_FAILURE_THRESHOLD`
- `ALERT_WEBHOOK_FAILURE_THRESHOLD`
- `ALERT_MAIL_FAILURE_THRESHOLD`

These values define the operator baseline for structured logs and alert thresholds. Delivery and event recording continue in later `1.5.x` tasks.

## Backup And Audit Baseline

### Runtime Fields

- `DB_BACKUP_ENABLED`
- `DB_BACKUP_CADENCE_HOURS`
- `DB_BACKUP_RETENTION_DAYS`
- `DB_BACKUP_LAST_VERIFIED_AT`
- `ADMIN_AUDIT_LOG_ENABLED`
- `SUPPORT_EVENT_LOG_ENABLED`
- `SECURITY_CHECKLIST_LAST_REVIEWED_AT`

These values define the governed operational policy for later backup, restore, and audit implementation work.
