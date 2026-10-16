import { useCallback, useEffect, useState } from "react";
import { listPosBills } from "./pos.services";
import type { PosBill } from "./pos.types";
export function usePosBills() {
  const [bills, setBills] = useState<PosBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBills(await listPosBills());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load bills.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const remember = (bill: PosBill) =>
    setBills((previous) =>
      [bill, ...previous.filter((row) => row.uuid !== bill.uuid)].slice(0, 50)
    );
  return { bills, loading, error, refresh, remember };
}
