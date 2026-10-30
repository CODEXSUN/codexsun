import { AppWindowIcon, DatabaseZapIcon } from "lucide-react";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { deskAddonAppIds, platformAppRegistry } from "../../app/app-registry";
import { usePlatformAppsQuery } from "../../modules/app-registry/app-registry.hooks";
import type { PlatformApp } from "../../modules/app-registry/app-registry.types";

export function SaAppCatalog({ onOpenApp }: { onOpenApp: (appId: string) => void }) {
  const query = usePlatformAppsQuery();
  if (query.isLoading) return <GlobalLoader fullScreen={false} />;
  if (query.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {query.error.message}
      </p>
    );
  }

  const apps = [...(query.data ?? [])].sort((left, right) => priority(left) - priority(right));
  const isAddon = (app: PlatformApp) => deskAddonAppIds.some((id) => id === app.appId);
  return (
    <>
      <CatalogGrid title="Apps" apps={apps.filter((app) => !isAddon(app))} onSelect={onOpenApp} />
      <CatalogGrid title="Add-ons" apps={apps.filter(isAddon)} onSelect={onOpenApp} />
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Super Admin tools</h2>
        <button
          type="button"
          onClick={() => onOpenApp("data-migration")}
          className="flex min-h-40 w-full max-w-md cursor-pointer flex-col items-start rounded-lg border border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/35"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
            <DatabaseZapIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="mt-4 text-base font-semibold">Data Migration</span>
          <span className="mt-1 text-sm leading-6 text-muted-foreground">
            Preview and copy external MariaDB tables into CODEXSUN with an audited run history.
          </span>
        </button>
      </section>
    </>
  );
}

function CatalogGrid({
  title,
  apps,
  onSelect
}: {
  title: string;
  apps: PlatformApp[];
  onSelect: (appId: string) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {apps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No registered {title.toLowerCase()}.</p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => {
          const definition = platformAppRegistry.find((item) => item.id === app.appId);
          const Icon = definition?.icon ?? AppWindowIcon;
          const accent = definition?.accentClass ?? "bg-primary";
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelect(app.appId)}
              title={app.description}
              aria-label={`View ${app.label} details`}
              className="flex min-h-40 min-w-0 cursor-pointer flex-col items-start rounded-lg border border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/35 dark:bg-muted/10"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white ${accent}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="mt-4 min-w-0">
                <span className="block text-base font-semibold">{app.label}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {app.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function priority(app: PlatformApp) {
  const index = ["application", "codexsun", "billing"].indexOf(app.appId);
  return index < 0 ? 3 : index;
}
