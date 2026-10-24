import { ArrowUpRightIcon, Code2Icon, LayoutDashboardIcon, Settings2Icon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@codexsun/ui/components/card";

type CodeitOverviewProps = { standaloneUrl?: string | undefined; onOpenSettings?: () => void };

// Read-only shell: no CRUD, API, persistence, jobs, or tenant data capabilities.
export function CodeitOverview({ standaloneUrl, onOpenSettings }: CodeitOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Developer kits
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Code2Icon className="size-6" />
            Codeit
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A separate development workspace built with the CODEXSUN design system.
          </p>
        </div>
        {standaloneUrl ? (
          <Button asChild>
            <a href={standaloneUrl} target="_blank" rel="noopener noreferrer">
              Open Codeit
              <ArrowUpRightIcon className="size-4" />
            </a>
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboardIcon className="size-4" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The app shell, navigation, overview, and runtime settings are available.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standalone runtime</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Codeit runs in its own web process. Platform supplies the catalog and tenant activation
            entry.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Development tools</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Project storage, code editing, AI actions, and command execution are not configured.
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace setup</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">
            Review the runtime and supported scope before adding development tools.
          </p>
          {onOpenSettings ? (
            <Button variant="outline" onClick={onOpenSettings}>
              <Settings2Icon className="size-4" />
              Settings
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function CodeitSettings({ standaloneUrl }: { standaloneUrl?: string | undefined }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Codeit settings</h1>
        <p className="text-sm text-muted-foreground">
          Runtime configuration and application scope.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Runtime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-[8rem_1fr] gap-3">
            <dt className="text-muted-foreground">Application</dt>
            <dd>Codeit</dd>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>Standalone web DevKit</dd>
            <dt className="text-muted-foreground">Data access</dt>
            <dd>None configured</dd>
            {standaloneUrl ? (
              <>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="break-all">
                  <a
                    className="underline"
                    href={standaloneUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {standaloneUrl}
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
          <p className="text-muted-foreground">
            The host configures the runtime address. Tenant app activation is managed through
            Platform Tenant Apps.
          </p>
          <p className="text-muted-foreground">
            This local shell does not read tenant records or grant access to files, credentials, or
            commands.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
