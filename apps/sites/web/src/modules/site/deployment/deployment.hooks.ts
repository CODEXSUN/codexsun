import { useCallback, useEffect, useState } from "react";
import type { DeploymentGateway, DeploymentState } from "./deployment.types.js";
export function useDeployment(uuid: string, gateway: DeploymentGateway | undefined) {
  const [state, setState] = useState<DeploymentState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!gateway) return;
    try {
      setState(await gateway.get(uuid));
      setError("");
    } catch {
      setError("Could not check deployment status. Refresh to try again.");
    }
  }, [uuid, gateway]);
  useEffect(() => {
    let active = true;
    void load();
    const timer = setInterval(() => {
      if (active) void load();
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [load]);
  async function retry(deploymentUuid: string) {
    if (!gateway) return;
    setBusy(true);
    try {
      setState(await gateway.retry(uuid, deploymentUuid));
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Retry failed.");
    } finally {
      setBusy(false);
    }
  }
  return { state, error, busy, load, retry };
}
