import { Button } from "@codexsun/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@codexsun/ui/components/dropdown-menu";
import { Laptop, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemePreference = "dark" | "light" | "system";
const storageKey = "logicx.theme";

const themeOptions = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Laptop, label: "System", value: "system" },
  { icon: Moon, label: "Dark", value: "dark" }
] as const;

export function LogicxThemeSelector() {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyPreference() {
      const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
      document.documentElement.dataset.logicxTheme = resolved;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
    }

    applyPreference();
    media.addEventListener("change", applyPreference);
    window.localStorage.setItem(storageKey, preference);

    return () => media.removeEventListener("change", applyPreference);
  }, [preference]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Theme: ${preference}`}
          className="logicx-theme-trigger"
          size="sm"
          variant="outline"
        >
          <Palette aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="logicx-theme-menu">
        <DropdownMenuLabel className="logicx-theme-menu-label">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          onValueChange={(value) => setPreference(value as ThemePreference)}
          value={preference}
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem
                className="logicx-theme-option"
                key={option.value}
                value={option.value}
              >
                <Icon aria-hidden="true" className="logicx-theme-option-icon" />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "dark" || stored === "light" || stored === "system" ? stored : "system";
}
