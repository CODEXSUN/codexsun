import { BookOpen, Folder } from "lucide-react";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { KnowledgeRecord } from "./knowledge.types";
export function buildKnowledgeMenu(
  pages: KnowledgeRecord[],
  selected: string,
  onSelect: (pageKey: string) => void
): SidemenuItem[] {
  const apps = [...new Set(pages.map((p) => p.appKey))];
  return apps.map((app) => {
    const entries = pages.filter((p) => p.appKey === app);
    return {
      title: entries[0]!.appLabel,
      icon: Folder,
      isActive: entries.some((p) => p.pageKey === selected),
      items: [...new Set(entries.map((page) => page.groupKey))].map((groupKey) => {
        const group = entries.filter((page) => page.groupKey === groupKey);
        return {
          title: group[0]!.groupLabel,
          icon: Folder,
          isActive: group.some((page) => page.pageKey === selected),
          items: group.map((page) => ({
            title: page.moduleKey ? page.title : page.title.replace(`${page.appLabel} `, ""),
            icon: BookOpen,
            isActive: page.pageKey === selected,
            onSelect: () => onSelect(page.pageKey)
          }))
        };
      })
    };
  });
}
export function KnowledgeList({
  pages,
  onSelect
}: {
  pages: KnowledgeRecord[];
  onSelect: (pageKey: string) => void;
}) {
  return (
    <WorkspaceTable
      data={pages}
      onRowClick={(page) => onSelect(page.pageKey)}
      emptyState="No documentation matches your search."
      columns={[
        { accessorKey: "title", header: "Page" },
        { accessorKey: "appLabel", header: "Application" },
        { accessorKey: "groupLabel", header: "Group" },
        {
          id: "source",
          header: "Content",
          cell: ({ row }) => (row.original.hasOverride ? "Tenant Markdown" : "Repository")
        }
      ]}
    />
  );
}
