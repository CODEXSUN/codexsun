export type ClientRoute = "overview" | "about" | "services" | "work" | "contact";
export type ClientPageRoute = ClientRoute | "learning-path" | "placement-path";

export type ClientRouteManifest = {
  label: string;
  path: Exclude<ClientRoute, "overview">;
  required: boolean;
};

export const clientRouteManifests: readonly ClientRouteManifest[] = [
  { label: "About", path: "about", required: true },
  { label: "Services", path: "services", required: true },
  { label: "Work", path: "work", required: true },
  { label: "Contact", path: "contact", required: true },
];

export const clientSlugs = ["codexsun", "devxcrew", "logicx", "skilloopz"] as const;

export function publicRoutePaths(): string[] {
  return [
    "/clients",
    ...clientSlugs.flatMap((slug) => [
      `/clients/${slug}`,
      ...clientRouteManifests.map((route) => `/clients/${slug}/${route.path}`),
      ...(slug === "skilloopz" ? ["/clients/skilloopz/learning-path", "/clients/skilloopz/placement-path"] : []),
    ]),
    "/clients/privacy",
    "/clients/terms",
    "/clients/cookies",
  ];
}

export function standaloneRoutePaths(): string[] {
  return ["/", ...clientRouteManifests.map((route) => `/${route.path}`), "/privacy", "/terms", "/cookies"];
}

export function resolveClientRoute(value: string | undefined): ClientPageRoute | undefined {
  if (!value || value === "overview") return "overview";
  if (value === "learning-path" || value === "placement-path") return value;
  return clientRouteManifests.some((route) => route.path === value) ? value as ClientRoute : undefined;
}
