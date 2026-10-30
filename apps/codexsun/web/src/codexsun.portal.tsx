import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import {
  CodexsunWorkspace,
  useCodexsunContext,
  type CodexsunGateway,
  type CodexsunSurface
} from "./modules/requirements";
import { CodexsunDevicesWorkspace } from "./modules/devices";
import { useCodexsunSync } from "./sync";
import { CodexsunRealtimePanel } from "./realtime/realtime.panel";

export function CodexsunPortal({
  gateway,
  surface
}: {
  gateway: CodexsunGateway;
  surface: CodexsunSurface;
}) {
  const context = useCodexsunContext(gateway);
  const scope = context.data
    ? { tenantUuid: context.data.tenantUuid, actorEmail: context.data.actorEmail }
    : null;
  const sync = useCodexsunSync({ gateway, scope });
  const [deviceRevision, setDeviceRevision] = useState(0);
  const refreshDevices = useCallback(() => setDeviceRevision((value) => value + 1), []);
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (sync.lastSyncedAt)
      void queryClient.invalidateQueries({ queryKey: ["codexsun", "requirements"] });
  }, [sync.lastSyncedAt, queryClient]);
  const kind = surface === "frontdesk" ? "web" : surface === "workspace" ? "desktop" : "mobile";
  return (
    <CodexsunWorkspace
      gateway={gateway}
      surface={surface}
      offline={offline || context.isError}
      cachedRequirements={sync.cachedRequirements}
      {...(sync.available ? { saveDraft: sync.saveDraft } : {})}
      devicePanel={
        <div className="space-y-3">
          {scope && (
            <CodexsunRealtimePanel gateway={gateway} portal={kind} onChange={refreshDevices} />
          )}
          <WorkspaceFormBanner title="Device sync" tone={sync.error ? "warning" : "info"}>
            <p>
              {sync.syncing ? "Syncing with cloud…" : `${sync.pending} drafts waiting to sync.`}
              {sync.lastSyncedAt ? ` Last sync: ${formatDateTime(sync.lastSyncedAt)}.` : ""}
            </p>
            {sync.error && <p>{sync.error}</p>}
            <Button
              variant="outline"
              disabled={!scope || sync.syncing}
              onClick={() => void sync.retry()}
            >
              Sync now
            </Button>
          </WorkspaceFormBanner>
          {scope && context.data?.permissions["codexsun.devices.view"] && (
            <CodexsunDevicesWorkspace
              gateway={gateway}
              scope={scope}
              kind={kind}
              revision={deviceRevision}
            />
          )}
        </div>
      }
    />
  );
}
