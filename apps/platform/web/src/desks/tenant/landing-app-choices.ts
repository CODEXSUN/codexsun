import { platformAppRegistry, type PlatformAppId } from "../../app/app-registry";

export function landingAppChoices(enabledApps: PlatformAppId[]) {
  const enabled = new Set(enabledApps);

  return platformAppRegistry
    .filter((app) => enabled.has(app.id))
    .map((app) => ({
      description: app.description,
      icon: app.icon,
      ...(app.iconSrc ? { iconSrc: app.iconSrc } : {}),
      iconClass:
        app.id === "zetro" ? "border border-border bg-white" : `${app.accentClass} text-white`,
      id: app.id,
      label: app.label
    }));
}
