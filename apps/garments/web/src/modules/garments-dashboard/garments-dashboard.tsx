import { CircleCheck, Clock3, PackageSearch, RefreshCw, Rows3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@codexsun/ui/components/card";
import { fetchFrappeLogs, type GarmentLog } from "./garments-dashboard.service";

const refreshOptions = [5, 10, 30] as const;
const visibleLogCount = 6;

export function GarmentCard() {
  const [logs, setLogs] = useState<GarmentLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshSeconds, setRefreshSeconds] = useState<(typeof refreshOptions)[number]>(10);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetchFrappeLogs();
      setLogs(response.logs);
      setLastUpdated(response.fetchedAt);
      setError(undefined);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not refresh the garment log feed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), refreshSeconds * 1_000);
    return () => window.clearInterval(interval);
  }, [refreshSeconds]);

  const requestCount = useMemo(() => logs.filter((log) => log.request_content !== null).length, [logs]);
  const latestLog = logs[0];
  const hasLiveResponse = Boolean(lastUpdated) && !error;

  return (
    <main className="size-full min-h-0 overflow-y-auto bg-muted/25 p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <Card className="relative z-10 border-primary/20 shadow-lg" aria-label="Garment card">
          <CardHeader className="border-b bg-blue-300">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PackageSearch className="size-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold  bg-green-400">Garment card</CardTitle>
                <CardDescription>Live apparel-log requests from Frappe.</CardDescription>
              </div>
            </div>
            <CardAction>
              <ConnectionStatus error={error} isLive={hasLiveResponse} isLoading={isLoading} />
            </CardAction>
          </CardHeader>

          <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
            <Metric icon={Rows3} label="Log entries" value={logs.length} />
            <Metric icon={PackageSearch} label="Requests received" value={requestCount} />
            <Metric icon={Clock3} label="Latest activity" value={latestLog ? formatDate(latestLog.creation) : "Waiting"} />
          </CardContent>

          <CardContent className="pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">Recent garment logs</h2>
                <p className="text-sm text-muted-foreground">Newest Frappe records appear first.</p>
              </div>
              <Button disabled={isLoading} onClick={() => void refresh()} size="sm" variant="outline">
                <RefreshCw className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </Button>
            </div>

            {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p> : null}
            {!error && !isLoading && logs.length === 0 ? <p className="rounded-lg border p-5 text-sm text-muted-foreground">No garment logs were returned.</p> : null}
            {!error && (isLoading || logs.length > 0) ? <LogList isLoading={isLoading} logs={logs.slice(0, visibleLogCount)} /> : null}
          </CardContent>

          <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
            <span>{lastUpdated ? `Updated ${formatDate(lastUpdated)}` : "Checking Frappe connection…"}</span>
            <div className="flex items-center gap-1" aria-label="Refresh interval">
              {refreshOptions.map((seconds) => (
                <Button key={seconds} onClick={() => setRefreshSeconds(seconds)} size="sm" variant={seconds === refreshSeconds ? "secondary" : "ghost"}>
                  {seconds}s
                </Button>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

function LogList({ isLoading, logs }: { isLoading: boolean; logs: GarmentLog[] }) {
  if (isLoading && logs.length === 0) {
    return <div className="rounded-lg border p-5 text-sm text-muted-foreground">Loading live Frappe logs…</div>;
  }

  return (
    <ul className="divide-y rounded-lg border" aria-label="Recent garment logs">
      {logs.map((log) => (
        <li className="grid gap-2 p-4 sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] sm:gap-x-5" key={log.name}>
          <div>
            <p className="font-medium">{log.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(log.creation)}</p>
          </div>
          <RequestContent value={log.request_content} />
        </li>
      ))}
    </ul>
  );
}

function ConnectionStatus({ error, isLive, isLoading }: { error?: string; isLive: boolean; isLoading: boolean }) {
  if (error) return <Badge variant="destructive">Connection needs attention</Badge>;
  if (!isLive) return <Badge variant="secondary">{isLoading ? "Checking Frappe" : "Waiting for response"}</Badge>;
  return (
    <Badge className="border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" variant="outline">
      <CircleCheck className="size-3.5" aria-hidden="true" />
      Frappe connected
    </Badge>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Rows3; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <Icon className="mb-3 size-4 text-primary" aria-hidden="true" />
      <p className="truncate text-lg font-semibold tracking-tight" title={String(value)}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RequestContent({ value }: { value: unknown }) {
  if (value === null || value === "") return <p className="text-sm text-muted-foreground">No request content</p>;
  const content = typeof value === "string" ? value : JSON.stringify(value);
  return <code className="line-clamp-3 break-all whitespace-pre-wrap rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">{content}</code>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}
