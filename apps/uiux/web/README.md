# UIUX Web

This standalone gallery reads public `@codexsun/ui` exports. It does not provide reusable controls to other apps.

It filters registry layers and shows selected-item metadata, including default
and supported variants, states, required props, accessibility notes, example
data, and lifecycle status.

It renders an isolated live preview for the selected published item. Preview theme,
density, surface, and state are browser-memory-only controls; they never change a
production application preference.

Set `PLATFORM_HOST` and `UIUX_WEB_PORT` in `web/.app.env`. The default UIUX
web port is `6102`, isolated from Platform (`6101`) and Zetro (`6131`). Run
`npm.cmd run dev:uiux`, `npm.cmd run check:uiux`, and `npm.cmd run build:uiux`.

Build output: `dist/uiux/web`.
