# Verification Standards

## Required layers

| Layer       | Proof                                                 |
| ----------- | ----------------------------------------------------- |
| Static      | Formatting, lint, types, boundaries, and line limit.  |
| Module      | Unit and repository tests for changed behavior.       |
| Integration | API, database, event, queue, and storage checks.      |
| User flow   | Playwright or equivalent visible client behavior.     |
| Docker      | Container composition, health, and dependency checks. |
| Production  | Selected deployment behavior with recorded evidence.  |

## Target rules

Web changes require browser-visible verification. Desktop changes require Tauri and native boundary verification. Mobile changes require Ionic and Capacitor target verification.

Static checks do not prove a user-visible flow. Docker health does not prove a completed user workflow. Production deployment does not prove a release unless the deployed version is identified.

## Evidence record

Record command, environment, result, date, and limitation. Store durable delivery evidence in `assist/records/`.

## Minimum final check

Run the repository-defined checks, `git diff --check`, and every focused check named in the task acceptance criteria.
