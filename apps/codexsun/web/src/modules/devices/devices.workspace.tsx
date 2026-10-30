import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useCodexsunDevices } from "./devices.hooks";
import { CodexsunDevicesList } from "./devices.list";
import type {
  CodexsunDeviceKind,
  CodexsunDevicesGateway,
  CodexsunDevicesScope
} from "./devices.types";

// Enrollment and presence only; device CRUD and native worker control are outside phase one.
export function CodexsunDevicesWorkspace({
  gateway,
  scope,
  kind,
  revision = 0
}: {
  gateway: CodexsunDevicesGateway;
  scope: CodexsunDevicesScope | null;
  kind: CodexsunDeviceKind;
  revision?: number;
}) {
  const devices = useCodexsunDevices(gateway, scope, kind, revision);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Connected portals</h2>
          <p className="text-sm text-muted-foreground">
            Your registered web, desktop and mobile browsers. Registration does not start a coding
            worker.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!scope || devices.loading}
            onClick={() => void devices.refresh()}
          >
            Refresh
          </Button>
          <Button disabled={!scope || devices.loading} onClick={() => void devices.register()}>
            Register this portal
          </Button>
        </div>
      </div>
      {devices.loading && <p className="text-sm text-muted-foreground">Connecting…</p>}
      {devices.error && (
        <WorkspaceFormBanner title="Device connection failed">
          <p>{devices.error}</p>
        </WorkspaceFormBanner>
      )}
      <CodexsunDevicesList records={devices.records} />
    </section>
  );
}
