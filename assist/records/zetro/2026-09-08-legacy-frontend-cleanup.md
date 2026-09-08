# Zetro Legacy Frontend Cleanup

## Outcome

Zetro has one browser page at `/zetro`. The page opens Zetro Desk. The obsolete
Chat web module, its styles, its topology entries, and the unused runtime hook
are removed. No Development page or route remains. A later reset also removed
the Task System web surface.

## Ownership

- Zetro Desk owns the public page.
- Settings remains an unmounted web module.
- The Chat API remains active because the server registers it and its contracts
  are covered by API tests.

## Decisions

- Remove dead browser code instead of keeping hidden feature copies.
- Keep the active API contract outside this frontend cleanup.
- Keep only topology regions that the current Desk can render.
- Remove conversation-only preferences from the current customization panel.

## Verification

Run the Zetro web typecheck, build, tests, lint, documentation checks, line
checks, and `git diff --check`. Open `/zetro` and confirm the empty Zetro Desk
renders without Chat or Development navigation.
