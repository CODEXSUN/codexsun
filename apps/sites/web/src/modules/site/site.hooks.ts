import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsSite, SiteGateway, SitePayload } from "./site.types.js";

export const siteQueryKey = ["sites", "portfolio-sites"] as const;

export function useSites(gateway: SiteGateway) {
  const [records, setRecords] = useState<CmsSite[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => records.find((site) => site.uuid === selectedUuid) ?? null,
    [records, selectedUuid]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sites = await gateway.list();
      setRecords(sites);
      setSelectedUuid((current) =>
        sites.some((site) => site.uuid === current) ? current : (sites[0]?.uuid ?? "")
      );
      return sites;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load sites.";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: SitePayload) => {
      const created = await gateway.create(payload);
      setRecords((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedUuid(created.uuid);
      return created;
    },
    [gateway]
  );

  const update = useCallback(
    async (uuid: string, payload: SitePayload) => {
      const updated = await gateway.update(uuid, payload);
      setRecords((prev) => prev.map((site) => (site.uuid === uuid ? updated : site)));
      return updated;
    },
    [gateway]
  );

  const toggleStatus = useCallback(
    async (site: CmsSite) => {
      const updated =
        site.status === "suspended" ? await gateway.restore(site.uuid) : await gateway.suspend(site.uuid);
      setRecords((prev) => prev.map((record) => (record.uuid === site.uuid ? updated : record)));
      return updated;
    },
    [gateway]
  );

  const remove = useCallback(
    async (uuid: string) => {
      await gateway.delete(uuid);
      setRecords((prev) => prev.filter((site) => site.uuid !== uuid));
      setSelectedUuid((current) => (current === uuid ? "" : current));
    },
    [gateway]
  );

  return {
    create,
    error,
    loading,
    records,
    refresh,
    remove,
    select: setSelectedUuid,
    selected,
    selectedUuid,
    toggleStatus,
    update
  };
}

export type SitesController = ReturnType<typeof useSites>;
