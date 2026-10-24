import { useSyncExternalStore } from "react";
import type { VerifiedBridgeConnection } from "./database-connection.types.js";
const key = "codexsun.data-bridge.connection";
const listeners = new Set<() => void>();
let current: VerifiedBridgeConnection | null = null;
try {
  const value = JSON.parse(localStorage.getItem(key) ?? "null") as VerifiedBridgeConnection | null;
  if (value && Number.isInteger(value.sourceId) && Number.isInteger(value.targetTenantId))
    current = value;
} catch {
  /* An invalid saved preference requires verification again. */
}
export function saveBridgeConnection(value: VerifiedBridgeConnection) {
  current = value;
  localStorage.setItem(key, JSON.stringify(value));
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useBridgeConnection() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}
