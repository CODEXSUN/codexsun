# Application Browser Titles

## Outcome

Every web application now uses its application name as the browser document title.

## Authoritative references

- Application rule: [Application standard](../../architecture/application-standard.md)
- Web workflow: [Web UI skill](../../skills/web-ui.md)

## Ownership and boundaries

Each web application owns its fallback `index.html` title. The shared MDI shell keeps the live browser title and visible application identity synchronized.

Shared templates must not replace the application-owned document title.

## Binding properties

| Application or workspace | HTML title | MDI application name |
| ------------------------ | ---------- | -------------------- |
| Platform system          | `Platform` | `Platform`           |
| Platform UI              | `UI`       | `UI`                 |
| Docs                     | `Docs`     | `Docs`               |
| DevKit                   | `DevKit`   | `DevKit`             |
| Zetro                    | `Zetro`    | `Zetro`              |
| Orship                   | `Orship`   | `Orship`             |

## Parallel work

The repository contained active Docs, Orship, Zetro, container, and shared UI changes. This update changed only the two mismatched HTML titles, the shared MDI title binding, and related documentation.

## Decisions

- Decision: use the plain application name in the browser tab.
- Reason: the tab and the MDI identity now use one name.
- Rejected alternative: prefix each application with `CODEXSUN`.
- Reason: the prefix hides the application name when browser tabs become narrow.

## Verification

- Verified all five `apps/<app>/web/index.html` titles against their MDI application names.
- Bound `MdiMain` document-title updates to its public `applicationName` property.
- Removed the UI Gallery title override so Platform routes keep the `Platform` title.
- Passed warning-free production builds for Platform, Docs, DevKit, Zetro, and Orship.
- Confirmed the live Platform browser tab resolves to `Platform` after React mounts.
- Confirmed that `/ui` supplies `UI` to the shared MDI shell for the browser title
  and command-bar identity.
- Verified the `UI` browser title and command-bar identity on `/ui?block=form` in Chrome.
- Passed focused formatting, lint, application-documentation, line-limit, and diff checks.
- The standalone shared UI build remains blocked by unrelated, unfinished UI Gallery files in the active worktree.
- No database, API, storage, desktop, or mobile behavior changed.
