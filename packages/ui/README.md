# UI Package

`components/` contains single reusable controls. `blocks/` groups components into reusable content blocks. `pages/` groups blocks into reusable page content. `templates/` groups pages into application shells.

Applications import components from `@codexsun/ui` and shared Tailwind CSS from `@codexsun/ui/assets`.

`ThemeProvider` owns approved theme and density selection. Applications use its public exports and semantic Tailwind token classes such as `bg-canvas`, `bg-surface`, and `text-foreground`.
