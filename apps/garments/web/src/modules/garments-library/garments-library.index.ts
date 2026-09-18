import type { DocumentSummary } from "@codexsun/garments-contracts";

export type GarmentsIndexGroup = {
  description: string;
  documents: DocumentSummary[];
  id: string;
  label: string;
};

export type GarmentsNavigationNode = {
  children?: GarmentsNavigationNode[];
  document?: DocumentSummary;
  id: string;
  label: string;
};

type GarmentsGroupDefinition = Omit<GarmentsIndexGroup, "documents"> & {
  matches: (path: string) => boolean;
};

const applicationOrder = ["platform", "garments", "zetro", "orship"];

export function getGarmentsIndexGroups(documents: DocumentSummary[]): GarmentsIndexGroup[] {
  const ungrouped = new Set(documents);
  const groups: GarmentsIndexGroup[] = [];

  for (const definition of getGroupDefinitions(documents)) {
    const group: GarmentsIndexGroup = {
      ...definition,
      documents: documents
        .filter((document) => ungrouped.has(document) && definition.matches(document.path))
        .sort((left, right) => getDocumentNavigationLabel(left).localeCompare(getDocumentNavigationLabel(right))),
    };
    group.documents.forEach((document) => ungrouped.delete(document));
    if (group.documents.length > 0) groups.push(group);
  }

  return groups;
}

export function getAdjacentDocuments(documents: DocumentSummary[], slug: string) {
  const orderedDocuments = getGarmentsIndexGroups(documents).flatMap((group) => group.documents);
  const activeIndex = orderedDocuments.findIndex((document) => document.slug === slug);

  return {
    next: activeIndex === -1 ? undefined : orderedDocuments[activeIndex + 1],
    previous: activeIndex <= 0 ? undefined : orderedDocuments[activeIndex - 1],
  };
}

export function getGarmentsNavigationNodes(group: GarmentsIndexGroup): GarmentsNavigationNode[] {
  const roots: MutableGarmentsNavigationNode[] = [];

  for (const document of group.documents) {
    const segments = getNavigationSegments(group, document);
    let siblings = roots;
    let nodeId = group.id;

    segments.forEach((label, index) => {
      nodeId = `${nodeId}/${label}`;
      let node = siblings.find((candidate) => candidate.id === nodeId);
      if (!node) {
        node = { children: [], id: nodeId, label };
        siblings.push(node);
      }
      if (index === segments.length - 1) node.document = document;
      siblings = node.children;
    });
  }

  return roots.map(toNavigationNode);
}

export function getDocumentNavigationLabel(document: DocumentSummary): string {
  const path = document.path;
  if (path.startsWith("assist/")) return getStructuredLabel(path, "assist");
  if (path.startsWith("apps/")) return getStructuredLabel(path, "apps");
  if (path.startsWith("packages/")) return getStructuredLabel(path, "packages");
  if (path.startsWith(".container/")) return getStructuredLabel(path, ".container");
  return document.title;
}

function getGroupDefinitions(documents: DocumentSummary[]): GarmentsGroupDefinition[] {
  return [
    {
      description: "Repository guidance, architecture, records, templates, and local skills.",
      id: "assists",
      label: "Assists",
      matches: (path) => path.startsWith("assist/"),
    },
    ...getOwnedGroups(documents, "apps", "Application notes and module ownership."),
    ...getOwnedGroups(documents, "packages", "Shared package notes and public contracts."),
    {
      description: "Deployment catalog, profiles, and container guidance.",
      id: "runtime",
      label: "Runtime",
      matches: (path) => path.startsWith(".container/"),
    },
    {
      description: "Markdown, MDX, and text sources outside a recognized documentation owner.",
      id: "unorganized",
      label: "Unorganized files",
      matches: (path) => !isOrganizedPath(path),
    },
    {
      description: "Repository-wide notes and entry documents.",
      id: "repository",
      label: "Repository",
      matches: () => true,
    },
  ];
}

function isOrganizedPath(path: string): boolean {
  return (
    path === "AGENTS.md" ||
    path === "README.md" ||
    path.startsWith("assist/") ||
    path.startsWith("apps/") ||
    path.startsWith("packages/") ||
    path.startsWith(".container/")
  );
}

function getOwnedGroups(
  documents: DocumentSummary[],
  directory: "apps" | "packages",
  description: string,
): GarmentsGroupDefinition[] {
  const names = new Set(
    documents.flatMap((document) => {
      const match = new RegExp(`^${directory}/([^/]+)/`).exec(document.path);
      return match ? [match[1]] : [];
    }),
  );

  return [...names]
    .sort((left, right) => compareOwners(directory, left, right))
    .map((name) => ({
      description,
      id: `${directory}-${name}`,
      label: directory === "packages" ? `Package · ${toDisplayName(name)}` : toDisplayName(name),
      matches: (path) => path.startsWith(`${directory}/${name}/`),
    }));
}

function compareOwners(directory: "apps" | "packages", left: string, right: string): number {
  if (directory !== "apps") return left.localeCompare(right);
  const leftIndex = applicationOrder.indexOf(left);
  const rightIndex = applicationOrder.indexOf(right);
  if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
}

function getStructuredLabel(path: string, root: "assist" | "apps" | "packages" | ".container"): string {
  const parts = path.split("/").slice(1);
  const filename = parts.pop();
  const folders = parts.map(toDisplayName);
  const leaf = filename === "README.md" ? "Overview" : toDisplayName(removeExtension(filename ?? ""));

  if (root === "assist") {
    return folders.length === 0 && leaf === "Overview"
      ? "Assist overview"
      : [...folders, leaf].filter(Boolean).join(" · ");
  }

  if (root === "apps") {
    const appPath = folders.slice(1);
    const owner = appPath[0];
    const moduleIndex = appPath.indexOf("Modules");
    const module = moduleIndex === -1 ? undefined : appPath.slice(moduleIndex + 1).join(" · ");
    if (module && (owner === "API" || owner === "Web")) return `${owner} · ${module}`;
    if (owner === "API" || owner === "Web") return `${owner} · ${leaf}`;
    return [...appPath, leaf].filter(Boolean).join(" · ");
  }

  return [...folders.slice(1), leaf].filter(Boolean).join(" · ");
}

function getNavigationSegments(group: GarmentsIndexGroup, document: DocumentSummary): string[] {
  const parts = document.path.split("/");
  const filename = parts.at(-1) ?? "";
  const leaf = filename === "README.md" ? "Overview" : toDisplayName(removeExtension(filename));

  if (group.id === "assists") {
    const folders = parts.slice(1, -1).map(toDisplayName);
    if (folders.length === 0) {
      return filename === "README.md" ? ["Assist overview"] : [toDisplayName(removeExtension(filename)), "Overview"];
    }
    return [...folders, leaf];
  }

  if (group.id.startsWith("apps-")) {
    const folders = parts.slice(2, -1);
    if (folders.length === 0) return ["Overview"];
    const surface = toDisplayName(folders[0]);
    const moduleIndex = folders.indexOf("modules");
    if (moduleIndex >= 0) {
      const modulePath = folders.slice(moduleIndex + 1).map(toDisplayName);
      return [surface, modulePath.join(" · ") || leaf];
    }
    return [surface, ...folders.slice(1).map(toDisplayName), leaf];
  }

  if (group.id.startsWith("packages-")) {
    const folders = parts.slice(2, -1).map(toDisplayName);
    return folders.length === 0 ? ["Overview"] : [...folders, leaf];
  }

  if (group.id === "runtime") {
    const folders = parts.slice(1, -1).map(toDisplayName);
    return folders.length === 0 ? ["Overview"] : [...folders, leaf];
  }

  const folders = parts.slice(0, -1).map(toDisplayName);
  return folders.length === 0 ? [leaf] : [...folders, leaf];
}

type MutableGarmentsNavigationNode = Omit<GarmentsNavigationNode, "children"> & {
  children: MutableGarmentsNavigationNode[];
};

function toNavigationNode(node: MutableGarmentsNavigationNode): GarmentsNavigationNode {
  return {
    ...node,
    children: node.children.length > 0 ? node.children.map(toNavigationNode) : undefined,
  };
}

function removeExtension(value: string): string {
  return value.replace(/\.(md|mdx|txt)$/i, "");
}

function toDisplayName(value: string): string {
  const displayName = value
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return displayName
    .replace(/\bApi\b/g, "API")
    .replace(/\bCodexsun\b/g, "CODEXSUN")
    .replace(/\bIto\b/g, "ITO")
    .replace(/\bMdi\b/g, "MDI")
    .replace(/\bMdx\b/g, "MDX")
    .replace(/\bUi\b/g, "UI");
}
