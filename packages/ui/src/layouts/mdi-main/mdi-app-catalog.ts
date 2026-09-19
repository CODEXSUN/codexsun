import { BookOpenIcon, BotIcon, BoxesIcon, PanelsTopLeftIcon } from "lucide-react";

import type { MdiAppItem } from "./mdi-types";

type MdiCatalogEntry = MdiAppItem & {
  id: "docs" | "platform" | "ui" | "zetro";
  localUrl: string;
  path: string;
};

const mdiApplicationCatalog: readonly MdiCatalogEntry[] = [
  {
    icon: BoxesIcon,
    id: "platform",
    label: "Platform",
    localUrl: requiredEnvironmentPort("VITE_PLATFORM_WEB_URL"),
    path: "/system",
  },
  {
    icon: PanelsTopLeftIcon,
    id: "ui",
    label: "UI",
    localUrl: requiredEnvironmentPort("VITE_UIUX_WEB_URL"),
    path: "/",
  },
  {
    icon: BookOpenIcon,
    id: "docs",
    label: "Docs",
    localUrl: requiredEnvironmentPort("VITE_DOCS_WEB_URL"),
    path: "/",
  },
  {
    icon: BotIcon,
    id: "zetro",
    label: "Zetro",
    localUrl: requiredEnvironmentPort("VITE_ZETRO_WEB_URL"),
    path: "/zetro",
  },
];

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

function isApplicationActive(id: MdiCatalogEntry["id"], applicationId: string): boolean {
  if (id === "ui") return applicationId === "ui" || applicationId === "uiux";
  if (id === "platform") return applicationId === "platform";
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
