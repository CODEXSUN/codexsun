# Task

## Active Batch

- Reference: `#116`
- Title: `Storefront homepage UX restoration`

### Phase 1 - Home route recovery

- [x] Reconnect the storefront home route to the split homepage feature modules.
- [x] Replace the temporary hidden shell-review placeholder with explicit loading and error states.

### Phase 2 - Validation and tracking

- [x] Run focused validation for the storefront homepage path.
- [x] Record the completed batch in `ASSIST/Documentation/CHANGELOG.md`.

### Phase 3 - Storefront title metadata

- [x] Remove the hardcoded storefront browser title and derive it from the runtime company brand.
- [x] Make the `/` storefront route title resolve to the company name only.
- [x] Run focused metadata validation and update the changelog entry.

### Phase 4 - Staged section review

- [x] Hide the homepage hero slider so the remaining storefront sections can be reviewed one by one.
- [x] Keep non-hero homepage sections and loading states visible for mobile responsiveness review.
- [x] Re-run focused storefront validation and update the batch notes for the staged review mode.

### Phase 5 - Shell title branding

- [x] Remove the remaining hardcoded `Codexsun` browser title fallback from the main app shell.
- [x] Derive dashboard page titles from the runtime company brand plus the active shell location title.
- [x] Add focused validation for the dashboard title formatter and update the batch notes.
