import { toast } from "sonner";
import { Switch } from "@codexsun/ui/components/switch";
import { useCatalogDataSource } from "./catalog-data-source.hooks";
import type { CatalogDataSourceModule } from "./catalog-data-source.types";

export function StorefrontSectionSwitch({ module }: { module: CatalogDataSourceModule }) {
  const source = useCatalogDataSource();
  const setting = source.settings.data?.modules.find((item) => item.module === module);
  const enabled = setting?.enabled ?? true;
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm">
      <Switch
        checked={enabled}
        disabled={!setting || source.visibility.isPending}
        onCheckedChange={(value) =>
          source.visibility.mutate(
            { enabled: value, module },
            {
              onError: (error) => toast.error(error.message),
              onSuccess: () =>
                toast.success(value ? "Storefront section enabled" : "Storefront section disabled")
            }
          )
        }
      />
      {enabled ? "Section enabled" : "Section disabled"}
    </label>
  );
}
