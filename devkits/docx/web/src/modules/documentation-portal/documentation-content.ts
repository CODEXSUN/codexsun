export type PortalDocument = {
  body: string[];
  id: string;
  path: string;
  summary: string;
  title: string;
};

export const portalDocuments: PortalDocument[] = [
  {
    body: [
      "DOCX is a documentation portal for product teams. It keeps guides, decisions, and implementation notes in one focused workspace.",
      "Use the sidebar to move between library areas. The reader keeps the active document, source path, actions, and section helper visible in one view.",
      "The editor is a dedicated writing surface. It uses the shared rich-text editor so writing, Markdown, HTML, and preview modes remain consistent across CODEXSUN applications.",
    ],
    id: "module-architecture",
    path: "devkits/docx/web/src/modules/documentation-portal/README.md",
    summary: "How DOCX composes a documentation portal from shared workspace UI.",
    title: "Module architecture",
  },
  {
    body: [
      "A document stays easy to maintain when one application owns its route, data, editing workflow, and reader state.",
      "Shared UI belongs in published package exports. Application modules compose those exports without importing another application's private source.",
      "A focused verification pass includes the affected web build, lint, type check, and browser-visible navigation flow.",
    ],
    id: "authoring-workflow",
    path: "devkits/docx/web/src/modules/documentation-portal/authoring-workflow.md",
    summary: "The authoring and verification flow for a DOCX page.",
    title: "Authoring workflow",
  },
  {
    body: [
      "The document helper mirrors the current article headings and keeps quick navigation close to the reader.",
      "Header actions keep editing, link sharing, and source-path copying compact and accessible.",
      "Ideas pages capture product direction separately from the document library, while remaining in the same workspace.",
    ],
    id: "portal-experience",
    path: "devkits/docx/web/src/modules/documentation-portal/portal-experience.md",
    summary: "The navigation, reader, header, helper, and editor experience.",
    title: "Portal experience",
  },
];

export const developmentStages = [
  ["1", "Library", "A discoverable document library with stable paths and focused reader routes."],
  ["2", "Owned workflow", "Editing and decisions remain owned by the application module."],
  ["3", "Shared editor", "Use the public rich-text editor rather than recreating formatting controls."],
  ["4", "Proof", "Validate the portal with static checks and visible browser flows."],
] as const;

export const architectureStandards = [
  ["Name one owner", "Each application and module owns its domain routes, view state, and records."],
  ["Protect boundaries", "Share published contracts and public package exports, never private source files."],
  ["Control dependencies", "Keep reusable interface behavior in shared UI and product behavior in the application."],
  ["Prove each change", "Record the decision and run focused checks before a wider release."],
] as const;
