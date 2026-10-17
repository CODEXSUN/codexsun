import { useEffect, useState } from "react";
import { listWaiters } from "./waiter.services";
import type { Waiter } from "./waiter.types";
export function useWaiters() {
  const [items, setItems] = useState<Waiter[]>([]);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setItems(await listWaiters());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load waiters.");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return { items, error, refresh };
}
