import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
const capabilities = [
  "Core product extensions",
  "Storefront publication",
  "SEO content",
  "Multi-vendor offers",
  "Variants and media",
  "Catalog channels"
];
export function CatalogOverviewWorkspace({ onOpenStore }: { onOpenStore: () => void }) {
  return (
    <WorkspacePage
      title="Ecommerce"
      description="Manage the company catalog and storefront publication flow."
    >
      <div className="flex justify-end">
        <Button onClick={onOpenStore}>
          Open Storefront
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map((capability) => (
          <Card
            key={capability}
            title={capability}
            description={
              capability === "Core product extensions"
                ? "Available in Product Information."
                : "Defined as a separate Ecommerce owner in the feature specification."
            }
          />
        ))}
      </div>
    </WorkspacePage>
  );
}
