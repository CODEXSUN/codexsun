export const themeNames = ["dark", "light"] as const;
export const themeDensities = ["compact", "default", "relaxed"] as const;

export type ThemeName = (typeof themeNames)[number];
export type ThemeDensity = (typeof themeDensities)[number];

export interface ThemeSelection {
  readonly theme: ThemeName;
  readonly density: ThemeDensity;
}

export function resolveThemeAttributes(selection: ThemeSelection): Record<string, string> {
  return { "data-theme": selection.theme, "data-density": selection.density };
}
