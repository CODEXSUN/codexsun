const defaultFlavorNames: Record<string, string> = {
  "alert": "Standard notice",
  "alert-dialog": "Confirmation dialog",
  "attachment": "File summary",
  "badge": "Solid",
  "breadcrumb": "Page hierarchy",
  "bubble": "Conversation exchange",
  "button": "Primary action",
  "card": "Content card",
  "collapsible": "Expandable section",
  "combobox": "Searchable selection",
  "compact-model-switcher": "Model selection",
  "context-menu": "Context actions",
  "dialog": "Task dialog",
  "direction": "Right to left",
  "drawer": "Bottom drawer",
  "dropdown-menu": "Action menu",
  "empty": "Text only",
  "hover-card": "Information preview",
  "input": "Enabled field",
  "input-otp": "Verification code",
  "item": "Standard row",
  "label": "Field label",
  "markdown-content": "Rendered article",
  "marker": "Section separator",
  "menubar": "Application commands",
  "message": "Conversation row",
  "message-scroller": "Scrollable conversation",
  "native-select": "Browser selection",
  "navigation-menu": "Primary navigation",
  "pagination": "Page controls",
  "popover": "Anchored panel",
  "progress": "Determinate progress",
  "questionnaire": "Single question",
  "radio-group": "Single choice",
  "rich-text-editor": "Writing surface",
  "scroll-area": "Scrollable panel",
  "select": "Themed selection",
  "sidebar": "Application navigation",
  "skeleton": "Content placeholder",
  "sparkline": "Area trend",
  "spinner": "Inline loading",
  "table": "Data grid",
  "tabs": "Content tabs",
  "textarea": "Multiline field",
  "toast": "Standard notification",
  "toaster": "Standard delivery",
  "toggle": "Filled",
  "tooltip": "Helper text",
  "tree": "Basic hierarchy"
};

export function flavorName(componentId: string, name: string) {
  return name === "Default" ? defaultFlavorNames[componentId] ?? "Standard" : name;
}

export function componentImportPath(id: string) {
  const file = id === "field" ? "Field" : id === "status-tone-badge" ? "StatusBadge" : id;
  return `@codexsun/ui/components/${file}`;
}
