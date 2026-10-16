import { AppWindowIcon } from "lucide-react";
import { Button, GlobalLoader } from "@codexsun/ui";
import { deskAddonAppIds, platformAppRegistry } from "../../app/app-registry";
import { usePlatformAppsQuery } from "../../modules/app-registry";
import { AppServiceList, useAppOperationsQuery } from "../../modules/app-orchestration";

export function SaAppDetails({ appId, onBack }: { appId: string; onBack: () => void }) {
  const query = usePlatformAppsQuery();
  const runtime = useAppOperationsQuery();
  const app = query.data?.find((item) => item.appId === appId);
  const definition = platformAppRegistry.find((item) => item.id === appId);
  const Icon = definition?.icon ?? AppWindowIcon;
  const accent = definition?.accentClass ?? "bg-primary";
  const platform = runtime.data?.find((item) => item.id === "platform");
  if (query.isLoading) return <GlobalLoader fullScreen={false} />;

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section
        className={`rounded-lg border bg-gradient-to-br p-6 shadow-sm ${accent} from-white/95 to-white/90 dark:from-background/95 dark:to-background/90`}
      >
        <Button variant="ghost" onClick={onBack}>
          ← Back to apps
        </Button>
        {query.error ? (
          <p role="alert">{query.error.message}</p>
        ) : !app ? (
          <p>App details could not be found.</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-4">
              <span
                className={`flex size-12 items-center justify-center rounded-lg text-foreground ${accent} bg-gradient-to-br from-white/85 to-white/85 dark:from-background/85 dark:to-background/85`}
              >
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <h1 className="text-3xl font-semibold">{app.label} Details</h1>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{app.description}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="App ID" value={app.appId} />
              <Detail label="Module" value={app.moduleKey} />
              <Detail
                label="Type"
                value={deskAddonAppIds.some((id) => id === app.appId) ? "Add-on" : "Application"}
              />
              <Detail label="Runtime" value="Platform" />
              <Detail label="Always enabled" value={app.alwaysEnabled ? "Yes" : "No"} />
              <Detail label="Default landing" value={app.defaultLanding ? "Yes" : "No"} />
              <Detail label="Stack" value={app.stack} />
              <Detail label="Public ID" value={app.uuid} />
            </dl>
          </>
        )}
      </section>
      {app ? (
        <>
          <p className="text-sm text-muted-foreground">
            This app runs inside Platform. The services below show its shared runtime.
          </p>
          {runtime.isLoading ? <GlobalLoader fullScreen={false} /> : null}
          {runtime.error ? (
            <p role="alert" className="text-sm text-destructive">
              {runtime.error.message}
            </p>
          ) : null}
          {platform ? <AppServiceList app={platform} /> : null}
        </>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/80 p-4">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words font-semibold">{value}</dd>
    </div>
  );
}
