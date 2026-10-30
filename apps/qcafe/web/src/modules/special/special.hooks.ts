import { useCallback, useEffect, useState } from "react";
import { getSpecialSettings } from "./special.services";
import type { SpecialSettings } from "./special.types";
export function useSpecialSettings() {
  const [settings, setSettings] = useState<SpecialSettings | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSettings(await getSpecialSettings());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load Today Special.");
    }
  }, []);
  useEffect(() => {
    void refresh();
    const changed = () => {
      void refresh();
    };
    window.addEventListener("qcafe-specials-updated", changed);
    return () => window.removeEventListener("qcafe-specials-updated", changed);
  }, [refresh]);
  return { settings, error, refresh };
}
