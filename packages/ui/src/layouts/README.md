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

Feature visibility is stored per `applicationId`. The shared feature settings
screen can toggle the top menu, notifications, application switcher, profile
menu, and bottom status bar. Product routes and workflows remain app-owned.

Applications import layouts through their public `@codexsun/ui/layouts/*`
entry points.
