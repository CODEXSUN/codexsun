import {
  BoxesIcon,
  MailIcon,
  ReceiptTextIcon,
  ServerCogIcon,
  type LucideIcon
} from "lucide-react";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import type { OrchestratedApp, OrchestratedAppId } from "./app-orchestration.types";

const icons: Record<string, LucideIcon> = {
  billing: ReceiptTextIcon,
  mail: MailIcon,
  platform: ServerCogIcon
};

const tones: Record<string, { card: string; icon: string; metric: string }> = {
  billing: {
    card: "border-emerald-200/80 from-emerald-100 via-green-50 to-teal-100 hover:border-emerald-300 dark:border-emerald-800/70 dark:from-emerald-950/70 dark:via-green-950/50 dark:to-teal-950/70",
    icon: "border-emerald-200 bg-white/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    metric:
      "border-emerald-100 from-emerald-50/80 via-card to-teal-50/70 dark:border-emerald-900 dark:from-emerald-950/35 dark:to-teal-950/25"
  },
  mail: {
    card: "border-violet-200/80 from-violet-100 via-purple-50 to-fuchsia-100 hover:border-violet-300 dark:border-violet-800/70 dark:from-violet-950/70 dark:via-purple-950/50 dark:to-fuchsia-950/70",
    icon: "border-violet-200 bg-white/70 text-violet-700 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-300",
    metric:
      "border-violet-100 from-violet-50/80 via-card to-fuchsia-50/70 dark:border-violet-900 dark:from-violet-950/35 dark:to-fuchsia-950/25"
  },
  platform: {
    card: "border-cyan-200/80 from-cyan-100 via-sky-50 to-blue-100 hover:border-cyan-300 dark:border-cyan-800/70 dark:from-cyan-950/70 dark:via-sky-950/50 dark:to-blue-950/70",
    icon: "border-cyan-200 bg-white/70 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300",
    metric:
      "border-cyan-100 from-cyan-50/80 via-card to-blue-50/70 dark:border-cyan-900 dark:from-cyan-950/35 dark:to-blue-950/25"
  }
};

const fallbackTone = {
  card: "border-slate-200/80 from-slate-100 via-card to-slate-50 hover:border-slate-300 dark:border-slate-800 dark:from-slate-950/70 dark:to-slate-900/50",
  icon: "border-slate-200 bg-white/70 text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300",
  metric:
    "border-slate-100 from-slate-50/80 via-card to-slate-100/70 dark:border-slate-900 dark:from-slate-950/35 dark:to-slate-900/25"
};

export function appOperationTone(id: OrchestratedAppId) {
  return tones[id] ?? fallbackTone;
}

export function appOperationStatusTone(status: OrchestratedApp["status"]) {
  if (status === "connected" || status === "online") return "green" as const;
  if (status === "partial") return "amber" as const;
  return "red" as const;
}

export function AppOperationsStrip({
  apps,
  onSelect
}: {
  apps: OrchestratedApp[];
  onSelect: (id: OrchestratedAppId) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {apps.map((app) => {
          const Icon = icons[app.id] ?? BoxesIcon;
          const tone = appOperationTone(app.id);
          const connectionLabel =
            app.kind === "runtime"
              ? `${app.services.filter((item) => item.online).length}/${app.services.length} services`
              : `${app.components.length} ${app.components.length === 1 ? "component" : "components"}`;
          return (
            <button
              className={`relative flex min-h-36 min-w-0 items-center gap-4 overflow-hidden rounded-lg border bg-gradient-to-br p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
              key={app.id}
              onClick={() => onSelect(app.id)}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -right-10 size-28 rounded-full bg-white/80 blur-2xl dark:bg-white/15"
              />
              <div
                className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-lg border shadow-sm ${tone.icon}`}
              >
                <Icon className="size-6" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="truncate font-semibold">{app.label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {app.packageName}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{connectionLabel}</span>
                  <StatusBadge tone={appOperationStatusTone(app.status)}>{app.status}</StatusBadge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AppServiceList({ app }: { app: OrchestratedApp }) {
  const items =
    app.kind === "runtime"
      ? app.services.map((service) => ({
          detail: `${service.host}:${service.port}`,
          id: `${service.id}-${service.port}`,
          label: service.label,
          response: service.responseMs === null ? "—" : `${service.responseMs} ms`,
          status: service.online ? "online" : "offline",
          tone: service.online ? ("green" as const) : ("red" as const)
        }))
      : app.components.map((component) => ({
          detail: app.packageName,
          id: component.id,
          label: component.label,
          response: app.readiness === "active" ? "Composed into Platform" : "Ready for modules",
          status: app.readiness,
          tone: app.readiness === "active" ? ("green" as const) : ("amber" as const)
        }));

  return (
    <section className="rounded-md border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">
          {app.kind === "runtime" ? "Services" : "Bundle components"}
        </h2>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <div
            className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.06] via-card to-card px-5 py-4"
            key={item.id}
          >
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-muted-foreground">{item.detail}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{item.response}</span>
              <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
