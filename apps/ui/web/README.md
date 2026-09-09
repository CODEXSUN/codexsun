# UI Web Workspace

This React and Vite workspace composes the public `@codexsun/ui` design system into an independent
documentation and preview application. It writes production output only to `dist/apps/ui/web`.

The [Gallery module](src/modules/gallery/README.md) owns the showcase routes, catalogs,
documentation pages, live specimens, example data, and navigation. Reusable components, blocks,
layouts, and design-system contracts remain in `packages/ui` and are consumed through public
exports.
