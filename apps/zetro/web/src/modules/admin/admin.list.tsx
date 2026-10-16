import { formatDateTime } from "@codexsun/ui/workspace";
import { Button } from "@codexsun/ui/components/button";
import type { ZetroGrant, ZetroInteractionLog, ZetroQueryPattern } from "./admin.types";
import { zetroCapabilityLabels } from "./admin.types";

export function ZetroPatternList({
  patterns,
  error,
  onRefresh
}: {
  patterns: ZetroQueryPattern[] | undefined;
  error?: Error | null;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Numbered query patterns</h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      {error ? <p role="alert">{error.message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Review status</th>
              <th className="p-2">UUID</th>
              <th className="p-2">Question pattern</th>
              <th className="p-2">Query pattern</th>
              <th className="p-2">Limitation</th>
              <th className="p-2">Extra</th>
            </tr>
          </thead>
          <tbody>
            {patterns?.map((item) => (
              <tr key={item.uuid} className="border-b align-top">
                <td className="p-2 font-medium">{item.serial_no}</td>
                <td className="p-2 font-medium">
                  {item.status === "active"
                    ? "Live"
                    : item.status === "draft"
                      ? "Draft"
                      : "Retired"}
                </td>
                <td className="p-2 font-mono text-xs break-all">{item.uuid}</td>
                <td className="p-2">{item.question_pattern}</td>
                <td className="p-2 font-mono text-xs">{item.query_pattern}</td>
                <td className="p-2">{item.limitation}</td>
                <td className="p-2">{item.extra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ZetroInteractionList({
  interactions,
  patterns,
  error,
  onRefresh
}: {
  interactions: ZetroInteractionLog[] | undefined;
  patterns: ZetroQueryPattern[] | undefined;
  error?: Error | null;
  onRefresh: () => void;
}) {
  const patternNumber = new Map(patterns?.map((item) => [item.uuid, item.serial_no]));
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Live interaction review</h2>
          <p className="text-sm text-muted-foreground">
            Latest 100 requests. Refreshes every 15 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      {error ? <p role="alert">{error.message}</p> : null}
      {interactions?.length === 0 ? <p>No interactions recorded yet.</p> : null}
      <div className="space-y-3">
        {interactions?.map((item) => (
          <article key={item.id} className="rounded-md border p-3 text-sm">
            <p className="mb-2 text-xs text-muted-foreground">
              #{item.pattern_uuid ? (patternNumber.get(item.pattern_uuid) ?? "?") : "?"} ·{" "}
              {item.outcome} · {item.skill_decision ?? item.intent} · {item.actor_email} ·{" "}
              {formatDateTime(item.created_at)}
            </p>
            <p className="whitespace-pre-wrap break-words">
              <strong>User:</strong> {item.prompt_text}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words">
              <strong>Zetro:</strong> {item.response_text ?? "No response recorded"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ZetroGrantList({ grants }: { grants: ZetroGrant[] | undefined }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[38rem] text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="p-2">Role</th>
            <th className="p-2">Read</th>
            <th className="p-2">Status</th>
            <th className="p-2">Approved by</th>
          </tr>
        </thead>
        <tbody>
          {grants?.map((grant) => (
            <tr key={`${grant.role_key}:${grant.capability_key}`} className="border-b">
              <td className="p-2">{grant.role_key}</td>
              <td className="p-2">
                {zetroCapabilityLabels[
                  grant.capability_key as keyof typeof zetroCapabilityLabels
                ] ?? grant.capability_key}
              </td>
              <td className="p-2">{grant.status}</td>
              <td className="p-2">{grant.approved_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {grants?.length === 0 ? <p className="p-2 text-sm">No role grants yet.</p> : null}
    </div>
  );
}
