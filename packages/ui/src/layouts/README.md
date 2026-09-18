# UI Layouts

Layouts are shared application frames. They own reusable navigation chrome and
content boundaries, but they do not own product routes, business entities,
persistence, or workflows.

## Layout boundaries

- `main-workspace` is the shared shell for desktop application workspaces.
- `mdi` is a plain centered-label surface for layout previews and empty states.
- `documentation-workspace` applies Docs defaults to `main-workspace`.
- `agent-workspace` adds activity rails inside `main-workspace`.
- `site-header`, `ecommerce-header`, and `blog-header` are standalone page
  headers. Do not compose them into `main-workspace`.

Each layout folder exports one public component through `index.ts`. Keep its
internal parts in the same folder. Name internal parts after their visible job,
such as `ecommerce-search` or `ecommerce-navigation`.

- `main-workspace` provides the CODEXSUN multiple-document application frame. Its
  public parts include the top menu, application switcher, profile menu,
  shadcn sidebar, status bar, and feature settings screen.
  Pass application-owned navigation data and workspace content through the
  public layout contract. Applications can provide a controlled search value
  and change callback; the layout renders the field but does not own search
  state or result behavior.

  When an application omits `children`, MDI leaves the workspace canvas empty.

  `showCanvasEndSpacer` is an optional preview-only switch. It adds a 48px canvas-end
  spacer for viewport inspection and defaults to `false`. Production applications
  should leave it disabled.

- `agent-workspace` provides a fixed Primary Activity Rail, a center Workspace Canvas,
  and a fixed Secondary Utility Rail. Applications supply typed icon items and actions.

Pass `agentWorkspace` to `MainWorkspace` to connect the Agent Workspace inside the shared shell.
The built-in feature settings show one visibility switch for each activity rail.
MDI places the Primary Activity Rail before the default sidebar and keeps the utility rail rightmost.

Applications can replace the standard primary action and navigation area with
`sidebarContent`. They can replace the footer with a React node or pass `null`
to remove it. An omitted `sidebarFooter` keeps the shared Feature settings
footer. The MDI shell continues to own sidebar sizing, collapse behavior, and
the rail toggle.

An application can map a parent ITO group to the complete area below the
command bar with `deskRegionId`. Its workspace and sidebar regions can then be
registered as child components of that desk.

Feature visibility is stored per `applicationId`. The shared feature settings
screen can toggle the top menu, notifications, application switcher, profile
menu, and bottom status bar. Product routes and workflows remain app-owned.

Applications can pass `statusEnd` to place compact metadata at the right edge
of the status bar. The application owns the content and its text style.

`MainWorkspace` binds `@codexsun/ui/theme` for every application. The appearance
control changes light, dark, or system mode and the shared accent composition.
Applications must use semantic tokens instead of storing their own shell theme.

`MainWorkspace` also sets the browser document title from `applicationName`. Shared
templates and application routes must not replace this title.

Applications import layouts through their public `@codexsun/ui/layouts/*`
entry points.

The default MDI application catalog links Platform, UI, Docs, Orship, and
Zetro. It uses the documented local ports when the current host is localhost
or `127.0.0.1`. Applications can provide `apps` to replace these destinations
for a deployed environment.

The ITO inspector shows a shadcn Select only when the current page supplies
more than one desk. `showMdiOverview` adds the shared MDI Overview desk. A
normal application desk contains only app-owned regions and does not show the
desk selector.
