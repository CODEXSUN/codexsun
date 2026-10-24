import { useEffect, useState } from "react";
import {
  getCommonBulkReport,
  latestCommonBulkReport,
  startCommonBulkImport
} from "./common-table-import.services.js";
import type { CommonBulkReport } from "./common-table-import.types.js";

export function useCommonBulkImport(
  sourceId: number,
  targetTenantId: number,
  scope: "common" | "masters" = "common"
) {
  const [report, setReport] = useState<CommonBulkReport | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError("");
    if (sourceId && targetTenantId)
      void latestCommonBulkReport(sourceId, targetTenantId, scope)
        .then((value) => {
          if (!cancelled) setReport(value);
        })
        .catch((cause: unknown) => {
          if (!cancelled)
            setError(
              cause instanceof Error ? cause.message : "Unable to load the combined report."
            );
        });
    return () => {
      cancelled = true;
    };
  }, [sourceId, targetTenantId, scope]);
  const active = report?.status === "queued" || report?.status === "running";
  useEffect(() => {
    if (!report || !active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getCommonBulkReport(report.id);
        if (!cancelled) {
          setReport(next);
          setError("");
        }
        if (["queued", "running"].includes(next.status) && !cancelled)
          timer = setTimeout(() => void poll(), 1500);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to refresh progress.");
          timer = setTimeout(() => void poll(), 3000);
        }
      }
    };
    timer = setTimeout(() => void poll(), 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [report?.id, active]);

  async function start() {
    setStarting(true);
    setError("");
    try {
      setReport(await startCommonBulkImport(sourceId, targetTenantId, scope));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to queue the import.");
    } finally {
      setStarting(false);
    }
  }
  return { report, error, active, starting, start };
}
