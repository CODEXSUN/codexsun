import { useCallback, useEffect, useState } from "react";
import { listMenu } from "./menu.services";
import type { MenuItem } from "./menu.types";
export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMenu());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load menu.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const handle = () => {
      void refresh();
    };
    window.addEventListener("qcafe-menu-updated", handle);
    return () => window.removeEventListener("qcafe-menu-updated", handle);
  }, [refresh]);
  return { items, error, loading, refresh };
}
