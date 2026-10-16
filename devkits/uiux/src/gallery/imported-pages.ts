export const importedPages = [
  { id: "app-header", name: "App Header", group: "Workspace", kind: "blocks" },
  { id: "execution-status", name: "Execution Status", group: "Workspace", kind: "blocks" },
  { id: "file-tree", name: "File Tree", group: "Workspace", kind: "blocks" },
  { id: "filter-builder", name: "Filter Builder", group: "Workspace", kind: "blocks" },
  { id: "form", name: "Form", group: "Workspace", kind: "blocks" },
  { id: "kanban", name: "Kanban", group: "Workspace", kind: "blocks" },
  { id: "table", name: "Data Table", group: "Workspace", kind: "blocks" },
  { id: "dropzone", name: "Dropzone", group: "Workspace", kind: "blocks" },
  { id: "mascot", name: "Mascot", group: "Workspace", kind: "blocks" },
  { id: "agent-chat-workspace", name: "Agent Chat Workspace", group: "Agent", kind: "blocks" },
  { id: "agent-provider-settings", name: "Agent Provider Settings", group: "Agent", kind: "blocks" },
  { id: "agent-task-workspace", name: "Agent Task Workspace", group: "Agent", kind: "blocks" },
  { id: "analysis-context", name: "Analysis Context", group: "Agent", kind: "blocks" },
  { id: "archived-chat-workspace", name: "Archived Chat Workspace", group: "Agent", kind: "blocks" },
  { id: "chat-composer", name: "Chat Composer", group: "Agent", kind: "blocks" },
  { id: "chat-history", name: "Chat History", group: "Agent", kind: "blocks" },
  { id: "chat-response-progress", name: "Chat Response Progress", group: "Agent", kind: "blocks" },
  { id: "chat-runtime-controls", name: "Chat Runtime Controls", group: "Agent", kind: "blocks" },
  { id: "chat-runtime-trace", name: "Chat Runtime Trace", group: "Agent", kind: "blocks" },
  { id: "codex-connection-settings", name: "Codex Connection Settings", group: "Agent", kind: "blocks" },
  { id: "handover-stack", name: "Handover Stack", group: "Agent", kind: "blocks" },
  { id: "idea-handover", name: "Idea Handover", group: "Agent", kind: "blocks" },
  { id: "auth", name: "Authentication", group: "Workspace", kind: "blocks" },
  { id: "loader", name: "Global Loader", group: "Workspace", kind: "blocks" },
  { id: "master-list", name: "Master List", group: "Workspace", kind: "blocks" },
  { id: "mermaid-preview", name: "Mermaid Preview", group: "Workspace", kind: "blocks" },
  { id: "notifications", name: "Notifications", group: "Workspace", kind: "blocks" },
  { id: "workspace", name: "Workspace Cards", group: "Workspace", kind: "blocks" },
  { id: "blog", name: "Blog", group: "Content", kind: "blocks" },
  { id: "footer", name: "Footer", group: "Content", kind: "blocks" },
  { id: "cart", name: "Cart", group: "Commerce", kind: "blocks" },
  { id: "categories", name: "Categories", group: "Commerce", kind: "blocks" },
  { id: "checkout", name: "Checkout", group: "Commerce", kind: "blocks" },
  { id: "comparison", name: "Comparison", group: "Commerce", kind: "blocks" },
  { id: "coupon-wallet", name: "Coupon Wallet", group: "Commerce", kind: "blocks" },
  { id: "delivery-tracker", name: "Delivery Tracker", group: "Commerce", kind: "blocks" },
  { id: "payment-methods", name: "Payment Methods", group: "Commerce", kind: "blocks" },
  { id: "price-history", name: "Price History", group: "Commerce", kind: "blocks" },
  { id: "pricing", name: "Pricing", group: "Commerce", kind: "blocks" },
  { id: "product-card", name: "Product Card", group: "Commerce", kind: "blocks" },
  { id: "reviews", name: "Reviews", group: "Commerce", kind: "blocks" },
  { id: "wishlist", name: "Wishlist", group: "Commerce", kind: "blocks" },
  { id: "blog-header", name: "Blog Header", group: "Web layouts", kind: "layouts" },
  { id: "ecommerce-header", name: "Ecommerce Header", group: "Web layouts", kind: "layouts" },
  { id: "site-header", name: "Site Header", group: "Web layouts", kind: "layouts" },
  { id: "agent-workspace", name: "Agent Workspace", group: "Web layouts", kind: "layouts" },
  { id: "documentation-workspace", name: "Documentation Workspace", group: "Web layouts", kind: "layouts" }
] as const;

export type ImportedPage = `${(typeof importedPages)[number]["kind"]}/${(typeof importedPages)[number]["id"]}`;

export function importedPage(id: (typeof importedPages)[number]["id"]): ImportedPage {
  const item = importedPages.find((entry) => entry.id === id)!;
  return `${item.kind}/${item.id}`;
}

export function importedFromPage(page: string) {
  return importedPages.find((entry) => `${entry.kind}/${entry.id}` === page);
}
