import { lazy, Suspense, type ComponentType } from "react";
import { importedFromPage, type ImportedPage } from "./imported-pages";

const documentationModules = import.meta.glob<Record<string, ComponentType>>(
  "./imported-blocks/ui-*-doc.tsx"
);
const ExtraDocumentation = lazy(() => import("./imported-extra-pages").then((module) => ({ default: module.ImportedExtraPage })));

const documentationPages = Object.fromEntries(
  Object.entries(documentationModules).map(([path, load]) => {
    const id = path.match(/ui-(.+)-doc\.tsx$/)?.[1];
    const exportName = `Ui${(id ?? "").split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join("")}Documentation`;
    return [
      id,
      lazy(async () => {
        const module = await load();
        const component = module[exportName];
        if (!component) throw new Error(`Missing live example: ${exportName}`);
        return { default: component };
      })
    ];
  })
) as Record<string, ComponentType>;

export function ImportedBlockPage({ page }: { page: ImportedPage }) {
  const item = importedFromPage(page);
  if (!item) return null;
  const Documentation = documentationPages[item.id];
  if (!Documentation) return <Suspense fallback={<p className="py-8 text-sm text-muted-foreground">Loading {item.name}…</p>}><ExtraDocumentation id={item.id} /></Suspense>;
  return (
    <Suspense fallback={<p className="py-8 text-sm text-muted-foreground">Loading {item.name}…</p>}>
      <Documentation />
    </Suspense>
  );
}
