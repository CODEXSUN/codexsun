# Q Cafe Sync Module

The sync module owns device profiles, the append-only change log, per-device sync cursors, and conflict records.

It depends on `qcafe.foundation`.

QC-0801 exposes device registration and revocation, change-log appends with per-device ordering, forward-only cursor advances, and conflict reporting with explicit resolution. Financial records (`bill`, `payment`, `refund`, `voucher`, `receipt`, `settlement`, `cash-movement`, `day-close`) never resolve silently: every resolution records a decider and a reason, and last-write-wins automation does not exist in this module.

QC-0802 exposes the push/pull sync session used by web, desktop, and mobile hosts through the change-envelope, cursor, idempotency, and conflict contracts. Pushed changes carry client-generated identifiers, so replays are idempotent. A push that competes with a newer remote change for the same entity creates a pending conflict instead of overwriting; advancing the cursor past the remote change and retrying records the accepted outcome, and the conflict still requires an explicit named resolution.
