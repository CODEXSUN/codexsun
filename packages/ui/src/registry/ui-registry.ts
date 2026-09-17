export const uiRegistryLayers = ["component", "block", "page", "template"] as const;
export const uiRegistryStates = ["default", "disabled", "loading", "empty", "error"] as const;

export type UiRegistryLayer = (typeof uiRegistryLayers)[number];
export type UiRegistryState = (typeof uiRegistryStates)[number];
export type UiRegistryStatus = "active" | "deprecated";

export interface UiRegistryEntry {
  readonly id: string;
  readonly name: string;
  readonly layer: UiRegistryLayer;
  readonly category: string;
  readonly defaultVariant: string;
  readonly variants: readonly string[];
  readonly sizes: readonly string[];
  readonly states: readonly UiRegistryState[];
  readonly requiredProps: readonly string[];
  readonly accessibility: readonly string[];
  readonly exampleData: string;
  readonly status: UiRegistryStatus;
}

export function createUiRegistry(entries: readonly UiRegistryEntry[]): readonly UiRegistryEntry[] {
  const ids = new Set<string>();
  for (const entry of entries) validateEntry(entry, ids);
  return Object.freeze([...entries]);
}

const componentRegistryEntries: readonly UiRegistryEntry[] = [
  componentEntry("input", "Input", "form", "default", ["default", "error"], ["default", "disabled", "error"], ["type"]),
  componentEntry(
    "select",
    "Select",
    "form",
    "default",
    ["default", "error"],
    ["default", "disabled", "error"],
    ["children"],
  ),
  componentEntry(
    "checkbox",
    "Checkbox",
    "form",
    "default",
    ["default"],
    ["default", "disabled", "error"],
    ["aria-label"],
  ),
  componentEntry("switch", "Switch", "form", "default", ["default"], ["default", "disabled", "error"], ["aria-label"]),
  componentEntry(
    "badge",
    "Badge",
    "feedback",
    "neutral",
    ["neutral", "success", "warning", "danger", "info"],
    ["default"],
    ["children"],
  ),
  componentEntry(
    "alert",
    "Alert",
    "feedback",
    "info",
    ["info", "success", "warning", "danger"],
    ["default"],
    ["children"],
  ),
  componentEntry(
    "card",
    "Card",
    "surface",
    "surface",
    ["surface", "flush", "outlined", "interactive"],
    ["default"],
    ["children"],
  ),
  componentEntry(
    "dialog",
    "Dialog",
    "overlay",
    "default",
    ["default", "confirmation", "destructive", "full-screen"],
    ["default"],
    ["title", "children"],
  ),
  componentEntry(
    "table",
    "Table",
    "data",
    "default",
    ["default", "dense", "selectable"],
    ["default", "loading", "empty"],
    ["children"],
  ),
  componentEntry(
    "empty-state",
    "Empty State",
    "feedback",
    "default",
    ["default", "error", "no-results", "no-access"],
    ["default", "error", "empty"],
    ["title"],
  ),
  componentEntry(
    "skeleton",
    "Skeleton",
    "feedback",
    "default",
    ["default", "text", "card", "table", "page"],
    ["loading"],
    [],
  ),
];

const compositionRegistryEntries: readonly UiRegistryEntry[] = [
  compositionEntry(
    "ui.block.content-section",
    "Content Section",
    "block",
    "layout",
    "surface",
    ["surface", "flush", "compact"],
    ["title", "children"],
  ),
  compositionEntry(
    "ui.page.dashboard",
    "Dashboard Page",
    "page",
    "workspace",
    "dashboard",
    ["dashboard"],
    ["title", "description", "children"],
  ),
  compositionEntry(
    "ui.page.settings",
    "Settings Page",
    "page",
    "workspace",
    "settings",
    ["settings"],
    ["title", "description", "children"],
  ),
];

export const uiRegistry = createUiRegistry([
  {
    id: "ui.component.button",
    name: "Button",
    layer: "component",
    category: "action",
    defaultVariant: "default",
    variants: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    sizes: ["xs", "sm", "default", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    states: ["default", "disabled", "error"],
    requiredProps: ["children"],
    accessibility: ["Use visible text or an aria-label for icon buttons.", "Focus remains visible."],
    exampleData: "Save changes",
    status: "active",
  },
  ...componentRegistryEntries,
  ...compositionRegistryEntries,
  {
    id: "ui.block.provider-status-card",
    name: "Provider Status Card",
    layer: "block",
    category: "status",
    defaultVariant: "surface",
    variants: ["surface"],
    sizes: [],
    states: ["default", "loading"],
    requiredProps: ["providerCount"],
    accessibility: ["Use a clear heading that identifies the provider status."],
    exampleData: "4 providers loaded",
    status: "active",
  },
  {
    id: "ui.page.provider-overview",
    name: "Provider Overview Page",
    layer: "page",
    category: "dashboard",
    defaultVariant: "dashboard",
    variants: ["dashboard"],
    sizes: [],
    states: ["default", "loading", "error"],
    requiredProps: ["providerCount"],
    accessibility: ["Keep startup guidance readable at standard zoom."],
    exampleData: "Platform provider overview",
    status: "active",
  },
  {
    id: "ui.template.mdi-main",
    name: "MDI Main",
    layer: "template",
    category: "workspace",
    defaultVariant: "mdi",
    variants: ["mdi"],
    sizes: [],
    states: ["default", "loading"],
    requiredProps: ["title", "menu", "status", "children"],
    accessibility: ["Use a descriptive page title.", "Menu actions need visible text."],
    exampleData: "CODEXSUN Platform",
    status: "active",
  },
]);

function validateEntry(entry: UiRegistryEntry, ids: Set<string>): void {
  if (!/^ui\.(component|block|page|template)\.[a-z0-9-]+$/u.test(entry.id)) {
    throw new Error(`Invalid UI registry ID: ${entry.id}`);
  }
  if (ids.has(entry.id)) throw new Error(`Duplicate UI registry ID: ${entry.id}`);
  if (!entry.name.trim() || !entry.category.trim()) {
    throw new Error(`Registry entries need a name and category: ${entry.id}`);
  }
  if (!uiRegistryLayers.includes(entry.layer)) {
    throw new Error(`Invalid UI registry layer: ${entry.id}`);
  }
  if (!entry.variants.includes(entry.defaultVariant)) {
    throw new Error(`Default variant must be listed for: ${entry.id}`);
  }
  if (!entry.variants.length || !entry.states.length || !entry.accessibility.length || !entry.exampleData.trim()) {
    throw new Error(`Registry entry metadata is incomplete: ${entry.id}`);
  }
  if (entry.states.some((state) => !uiRegistryStates.includes(state))) {
    throw new Error(`Invalid UI registry state: ${entry.id}`);
  }
  ids.add(entry.id);
}

function componentEntry(
  id: string,
  name: string,
  category: string,
  defaultVariant: string,
  variants: readonly string[],
  states: readonly UiRegistryState[],
  requiredProps: readonly string[],
): UiRegistryEntry {
  return {
    id: `ui.component.${id}`,
    name,
    layer: "component",
    category,
    defaultVariant,
    variants,
    sizes: [],
    states,
    requiredProps,
    accessibility: ["Use an accessible name for interactive controls."],
    exampleData: name,
    status: "active",
  };
}

function compositionEntry(
  id: string,
  name: string,
  layer: UiRegistryLayer,
  category: string,
  defaultVariant: string,
  variants: readonly string[],
  requiredProps: readonly string[],
): UiRegistryEntry {
  return {
    id,
    name,
    layer,
    category,
    defaultVariant,
    variants,
    sizes: [],
    states: ["default", "loading"],
    requiredProps,
    accessibility: ["Use a clear heading and readable supporting text."],
    exampleData: name,
    status: "active",
  };
}
