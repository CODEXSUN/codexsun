import { BookOpenIcon, BotIcon, BoxesIcon, PanelsTopLeftIcon } from "lucide-react";

import type { MdiAppItem } from "./mdi-types";
import { mdiCatalogApplications } from "./mdi-app-catalog.generated";

type MdiCatalogEntry = MdiAppItem & {
  id: string;
  localUrl: string;
  path: string;
};

const icons = { docs: BookOpenIcon, platform: BoxesIcon, uiux: PanelsTopLeftIcon, zetro: BotIcon };
const mdiApplicationCatalog: readonly MdiCatalogEntry[] = mdiCatalogApplications.map((application) => ({
  icon: icons[application.icon as keyof typeof icons] ?? BoxesIcon,
  id: application.id,
  label: application.label,
  localUrl: requiredEnvironmentPort(application.localUrlKey),
  path: application.path,
}));

export function createDefaultMdiApps(applicationId: string): MdiAppItem[] {
  const currentLocation = typeof window === "undefined" ? undefined : window.location;

  return mdiApplicationCatalog.map(({ id, localUrl, path, ...app }) => ({
    ...app,
    active: isApplicationActive(id, applicationId),
    href: createApplicationHref(localUrl, path, currentLocation),
  }));
}

function requiredEnvironmentPort(key: string): string {
  const value = import.meta.env[key];
  if (!/^\d{1,5}$/u.test(value ?? "")) throw new Error(`${key} must be a local port in the root .env file.`);
  return value!;
}

function isApplicationActive(id: string, applicationId: string): boolean {
  return id === applicationId;
}

function createApplicationHref(localPort: string, path: string, currentLocation?: Location): string {
  if (!currentLocation || !isLocalHostname(currentLocation.hostname)) return path;

  const target = new URL(currentLocation.origin);
  target.port = localPort;
  target.pathname = path;
  target.search = "";
  target.hash = "";
  return target.toString();
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}
