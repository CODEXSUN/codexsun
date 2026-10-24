import { useEffect, useState } from "react";
import { getBusinessImport } from "./business-import.services.js";
import type { BusinessReport, ReportPage } from "./business-import.types.js";
export function useBusinessRun(id: string) {
  const [run, setRun] = useState<BusinessReport | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    setError("");
    setRun(null);
    const poll = async () => {
      try {
        const next = await getBusinessImport(id);
        if (!active) return;
        setRun(next);
        setError("");
        if (["queued", "running"].includes(next.status))
          timer = setTimeout(() => void poll(), 1500);
      } catch (cause) {
        if (active)
          setError(cause instanceof Error ? cause.message : "Unable to load business import.");
      }
    };
    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, reload]);
  return { run, error, refresh: () => setReload((n) => n + 1) };
}
export function useBusinessPage<T>(load: () => Promise<ReportPage<T>>) {
  const [data, setData] = useState<ReportPage<T>>({ total: 0, rows: [] }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    void load()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [load]);
  return { data, error, busy };
}
