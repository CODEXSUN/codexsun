import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodexsunIndexedDbStorage } from "../../sync";
import { CodexsunDevicesService } from "./devices.services";
import type {
  CodexsunDevice,
  CodexsunDeviceKind,
  CodexsunDevicesGateway,
  CodexsunDevicesScope
} from "./devices.types";

export function useCodexsunDevices(
  gateway: CodexsunDevicesGateway,
  scope: CodexsunDevicesScope | null,
  kind: CodexsunDeviceKind,
  revision = 0
) {
  const key = scope ? JSON.stringify([scope.tenantUuid, scope.actorEmail.toLowerCase(), kind]) : "";
  const current = useRef({ key, gateway, generation: 0 });
  if (current.current.key !== key || current.current.gateway !== gateway)
    current.current = { key, gateway, generation: current.current.generation + 1 };
  const generation = current.current.generation;
  const registered = useRef<{ generation: number; uuid: string } | null>(null);
  const [state, setState] = useState<{
    key: string;
    records: CodexsunDevice[];
    loading: boolean;
    error: string | null;
  }>({ key: "", records: [], loading: false, error: null });
  const service = useMemo(
    () => (scope ? new CodexsunDevicesService(gateway, scope) : null),
    [gateway, key, generation]
  );
  const refresh = useCallback(
    async (register = false) => {
      if (!service || !scope) return;
      setState((previous) => ({ ...previous, key, loading: true, error: null }));
      try {
        if (register) {
          const storage = new CodexsunIndexedDbStorage(scope);
          let deviceKey: string;
          try {
            deviceKey = await storage.deviceKey(kind);
          } finally {
            storage.close();
          }
          if (current.current.generation !== generation) return;
          const device = await service.register(deviceKey, kind);
          if (current.current.generation !== generation) return;
          await service.heartbeat(device.uuid);
          if (current.current.generation !== generation) return;
          registered.current = { generation, uuid: device.uuid };
        }
        if (current.current.generation !== generation) return;
        const records = await service.list();
        if (current.current.generation === generation)
          setState({ key, records, loading: false, error: null });
      } catch (error) {
        if (current.current.generation === generation)
          setState((previous) => ({
            ...previous,
            loading: false,
            error: error instanceof Error ? error.message : "Devices could not be loaded"
          }));
      }
    },
    [key, service, kind, generation]
  );
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      const device = registered.current;
      if (
        !service ||
        !device ||
        device.generation !== generation ||
        current.current.generation !== generation
      )
        return;
      void service
        .heartbeat(device.uuid)
        .then(() => refresh())
        .catch((error: unknown) => {
          if (current.current.generation === generation)
            setState((previous) => ({
              ...previous,
              error: error instanceof Error ? error.message : "Device contact failed"
            }));
        });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh, service, generation, revision]);
  const visible = state.key === key && key ? state : { records: [], loading: false, error: null };
  return { ...visible, refresh: () => refresh(), register: () => refresh(true) };
}
