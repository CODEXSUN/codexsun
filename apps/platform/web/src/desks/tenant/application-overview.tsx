import {
  Building2Icon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  type LucideIcon
} from "lucide-react";
import { deskAddonAppIds, platformAppRegistry, type PlatformAppId } from "../../app/app-registry";

type OverviewPage =
  | "application.landing"
  | "application.settings"
  | "core.organisation.company"
  | "core.organisation.financial-year"
  | "core.organisation.default-company";

export function ApplicationOverview({
  companyName,
  financialYear,
  tenantName,
  signedInEmail,
  enabledApps,
  landingApp,
  onNavigate,
  onOpenApp
}: {
  companyName: string;
  financialYear: string;
  tenantName: string;
  signedInEmail: string;
  enabledApps: PlatformAppId[];
  landingApp: PlatformAppId;
  onNavigate: (page: OverviewPage) => void;
  onOpenApp: (appId: PlatformAppId) => void;
}) {
  const apps = platformAppRegistry.filter((app) => enabledApps.includes(app.id));
  const landing = apps.find((app) => app.id === landingApp);
  return (
    <section className="space-y-5">
      <header className="rounded-lg border bg-gradient-to-br from-sky-50/60 via-card to-violet-50/40 p-6 dark:from-sky-950/20 dark:to-violet-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid size-12 place-items-center rounded-lg border bg-background">
              <LayoutDashboardIcon className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{tenantName}</p>
              <h1 className="mt-1 text-2xl font-semibold">Application overview</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your organisation, workspace preferences, and access.
              </p>
            </div>
          </div>
          <span className="break-all text-sm text-muted-foreground">{signedInEmail}</span>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Summary
          title="Current company"
          value={companyName}
          icon={Building2Icon}
          onClick={() => onNavigate("core.organisation.company")}
        />
        <Summary
          title="Financial year"
          value={financialYear}
          icon={CalendarDaysIcon}
          onClick={() => onNavigate("core.organisation.financial-year")}
        />
        <Summary
          title="Landing app"
          value={landing?.label ?? "Application"}
          icon={LayoutDashboardIcon}
          onClick={() => onNavigate("application.landing")}
        />
        <Summary
          title="Available apps"
          value={String(apps.length)}
          icon={ShieldCheckIcon}
          onClick={() => onNavigate("application.settings")}
        />
      </div>
      {([false, true] as const).map((addons) => {
        const entries = apps.filter((app) => deskAddonAppIds.includes(app.id) === addons);
        if (!entries.length) return null;
        return (
          <section key={String(addons)} className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">{addons ? "Add-ons" : "Your apps"}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onOpenApp(app.id)}
                  className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/15 p-4 text-left transition-colors hover:bg-muted/35"
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-md text-white ${app.accentClass}`}
                  >
                    <app.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{app.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      {app.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function Summary({
  title,
  value,
  icon: Icon,
  onClick
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border bg-muted/15 p-5 text-left hover:bg-muted/30"
    >
      <span>
        <span className="block text-sm text-muted-foreground">{title}</span>
        <span className="mt-2 block break-words text-lg font-semibold">{value}</span>
      </span>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
