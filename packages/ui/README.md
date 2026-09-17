# UI Package

`components/` contains single reusable controls. `blocks/` groups components into reusable content blocks. `pages/` groups blocks into reusable page content. `templates/` groups pages into application shells.

Applications import components from `@codexsun/ui` and shared Tailwind CSS from `@codexsun/ui/assets`.

`ThemeProvider` owns approved theme and density selection. Applications use its public exports and semantic Tailwind token classes such as `bg-canvas`, `bg-surface`, and `text-foreground`.

`uiRegistry` is the public metadata source for UIUX and documentation tools. It lists each published item, its allowed variants, states, required props, accessibility notes, example data, and lifecycle status. Applications and UIUX must import it only from `@codexsun/ui`.

Registry validation rejects duplicate IDs, invalid layers or states, invalid
defaults, and incomplete required metadata. The focused registry test lists all
active published UI items. Update that list with every public visual UI export.

Base exports include form controls, Button, Badge, Alert, Card, Dialog, Table, EmptyState, and Skeleton. Use these exports instead of application-local primitives.
