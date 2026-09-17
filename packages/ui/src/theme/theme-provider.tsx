import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { resolveThemeAttributes, type ThemeDensity, type ThemeName, type ThemeSelection } from "./theme-contract";

interface ThemeContextValue extends ThemeSelection {
  setTheme(theme: ThemeName): void;
  setDensity(density: ThemeDensity): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeName;
  readonly defaultDensity?: ThemeDensity;
}

export function ThemeProvider({ children, defaultTheme = "dark", defaultDensity = "default" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);
  const [density, setDensity] = useState<ThemeDensity>(defaultDensity);
  const attributes = resolveThemeAttributes({ theme, density });
  const value = useMemo(() => ({ theme, density, setTheme, setDensity }), [theme, density]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
  }, [theme, density]);

  return (
    <ThemeContext.Provider value={value}>
      <div {...attributes}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}
