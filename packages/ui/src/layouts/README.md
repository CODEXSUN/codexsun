# UI Layouts

Layouts are shared application frames. They own reusable navigation chrome and
content boundaries, but they do not own product routes, business entities,
persistence, or workflows.

- `mdi-main` provides the CODEXSUN multiple-document application frame. Its
  public parts include the top menu, application switcher, profile menu,
  shadcn sidebar, status bar, empty workspace, and feature settings screen.
  Pass application-owned navigation data and workspace content through the
  public layout contract. Applications can provide a controlled search value
  and change callback; the layout renders the field but does not own search
  state or result behavior.

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

`MdiMain` binds `@codexsun/ui/theme` for every application. The appearance
control changes light, dark, or system mode and the shared accent composition.
Applications must use semantic tokens instead of storing their own shell theme.

Applications import layouts through their public `@codexsun/ui/layouts/*`
entry points.

The default MDI application catalog links Platform, UI, Docs, DevKit, and
Zetro. It uses the documented local ports when the current host is localhost
or `127.0.0.1`. Applications can provide `apps` to replace these destinations
for a deployed environment.

The ITO inspector shows a shadcn Select only when the current page supplies
more than one desk. `showMdiOverview` adds the shared MDI Overview desk. A
normal application desk contains only app-owned regions and does not show the
desk selector.
