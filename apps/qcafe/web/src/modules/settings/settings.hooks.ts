import { useCallback, useEffect, useState } from "react";
import { defaultCafeSettings, type CafeSettings } from "./settings.types";
import { getCafeSettings } from "./settings.services";
export function useCafeSettings() {
  const [settings, setSettings] = useState<CafeSettings>(defaultCafeSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSettings(await getCafeSettings());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Cannot load settings.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const changed = () => {
      void refresh();
    };
    window.addEventListener("qcafe-settings-updated", changed);
    return () => window.removeEventListener("qcafe-settings-updated", changed);
  }, [refresh]);
  return { settings, loading, error, refresh };
}
