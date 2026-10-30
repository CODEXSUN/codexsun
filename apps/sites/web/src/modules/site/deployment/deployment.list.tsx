import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { formatDateTime } from "@codexsun/ui/workspace";
import type { DeploymentState } from "./deployment.types.js";
export function DeploymentList({ history }: { history: DeploymentState["history"] }) {
  return (
    <ol className="grid gap-2">
      {history.slice(0, 5).map((row) => (
        <li
          key={row.uuid}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
        >
          <span>
            Version {row.version} · Draft revision {row.revision}
            <small className="block text-muted-foreground">
              {formatDateTime(row.updatedAt)} · {row.actor}
            </small>
          </span>
          <StatusBadge
            tone={
              row.status === "live"
                ? "green"
                : row.status === "failed"
                  ? "red"
                  : row.status === "running"
                    ? "blue"
                    : "neutral"
            }
          >
            {row.status}
          </StatusBadge>
        </li>
      ))}
    </ol>
  );
}
