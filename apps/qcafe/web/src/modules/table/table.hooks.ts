import { useEffect, useState } from "react";
import { listTables } from "./table.services";
import type { CafeTable } from "./table.types";
export function useTables() {
  const [items, setItems] = useState<CafeTable[]>([]);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setItems(await listTables());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load tables.");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return { items, error, refresh };
}
