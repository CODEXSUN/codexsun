# Zetro Empty Desk Reset

## Outcome

The `/zetro` page now contains an empty Zetro Desk inside the shared MDI shell.
The Create task action, Task System workspace, task customization control, task
styles, and task topology entries are removed.

The page uses the shared global loader during startup. The loader covers the
screen until the MDI shell completes two painted frames, then fades out.
The loader shows only the spinner. Its loading label remains available to
assistive technology.

## Ownership

- `zetro.desk.web` owns the empty page and topology region `15`.
- `zetro.tasks.api` still owns the task API and private task data.
- Settings remains an unmounted web module.

## Decisions

- Remove the old task frontend source so the later screen starts clean.
- Preserve the Tasks API and its data because this work changes only the screen.
- Keep the shared MDI shell and Zetro Desk region.
- Use the package-owned global loader instead of an app-specific spinner.
- Add each future screen region only after user approval.

## Database changes

Database update: No. The private task data was not changed or deleted.

## Verification

Run the Zetro web typecheck and production build. Run the Zetro API tests and
documentation checks. Open `/zetro` and confirm the loader fades into the empty
Desk without a content flash.
