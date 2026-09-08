# UI Templates

Templates are composition-ready, reusable UI assemblies. They may compose
shared primitives and sample presentation data, but they must not own product
routes, business entities, persistence, or workflows.

- `dashboard-01` contains the shadcn dashboard template and sample table data.
- `sidebar-07` contains the shadcn collapsible navigation template.
- `documentation-sidebar` contains the data-driven documentation navigation
  template shared by documentation applications.
- `ui-gallery` contains live component previews, the complete component source
  inventory, template references, and Interface Topology Inspection.
  Applications import a template through its public package entry point and own
  the surrounding screen composition.
