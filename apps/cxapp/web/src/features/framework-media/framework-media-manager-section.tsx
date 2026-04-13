import { useEffect, useState } from "react"
import { CheckCircle2Icon, LinkIcon, LoaderCircleIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react"

import type { MediaSymlinkStatus } from "../../../../../framework/shared/media"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getFrameworkMediaSymlinkStatus, manageFrameworkMediaSymlink } from "./media-api"
import { FrameworkMediaBrowser } from "./media-browser"

export function FrameworkMediaManagerSection() {
  const [symlinkStatus, setSymlinkStatus] = useState<MediaSymlinkStatus | null>(null)
  const [isLoadingSymlinkStatus, setIsLoadingSymlinkStatus] = useState(true)
  const [symlinkAction, setSymlinkAction] = useState<"verify" | "recreate" | null>(null)
  const [symlinkError, setSymlinkError] = useState<string | null>(null)

  async function loadSymlinkStatus() {
    setIsLoadingSymlinkStatus(true)
    setSymlinkError(null)

    try {
      const response = await getFrameworkMediaSymlinkStatus()
      setSymlinkStatus(response.item)
    } catch (error) {
      setSymlinkError(
        error instanceof Error ? error.message : "Failed to read media symlink status."
      )
    } finally {
      setIsLoadingSymlinkStatus(false)
    }
  }

  useEffect(() => {
    void loadSymlinkStatus()
  }, [])

  async function handleSymlinkAction(action: "verify" | "recreate") {
    setSymlinkAction(action)
    setSymlinkError(null)

    try {
      const response = await manageFrameworkMediaSymlink(action)
      setSymlinkStatus(response.item)
    } catch (error) {
      setSymlinkError(
        error instanceof Error ? error.message : "Failed to update media symlink."
      )
    } finally {
      setSymlinkAction(null)
    }
  }

  const statusTone =
    symlinkStatus?.status === "healthy"
      ? "default"
      : symlinkStatus?.status === "missing"
        ? "secondary"
        : "destructive"

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Media Manager
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Shared media storage for company branding, product galleries, sliders, and any
          future module that needs managed image attachments.
        </p>
      </div>
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Public Media Symlink</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Verify that `/storage` points to the runtime public media folder, or recreate it
                when the mount is missing after a deploy or filesystem change.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleSymlinkAction("verify")}
                disabled={isLoadingSymlinkStatus || symlinkAction != null}
              >
                {symlinkAction === "verify" ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="size-4" />
                )}
                Verify
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSymlinkAction("recreate")}
                disabled={isLoadingSymlinkStatus || symlinkAction != null}
              >
                {symlinkAction === "recreate" ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <LinkIcon className="size-4" />
                )}
                Add or Recreate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isLoadingSymlinkStatus ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Checking media symlink status...
            </div>
          ) : symlinkStatus ? (
            <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex items-start gap-2">
                {symlinkStatus.status === "healthy" ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 text-primary" />
                ) : (
                  <TriangleAlertIcon className="mt-0.5 size-4 text-amber-600" />
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusTone}>{symlinkStatus.status}</Badge>
                    <Badge variant="outline">
                      {symlinkStatus.isSymbolicLink ? "symlink" : "not symlink"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">
                    {symlinkStatus.detail ?? "No symlink detail available."}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Mount:</span> {symlinkStatus.mountPath}
                </p>
                <p>
                  <span className="font-medium text-foreground">Target:</span> {symlinkStatus.targetPath}
                </p>
                <p>
                  <span className="font-medium text-foreground">Resolved:</span>{" "}
                  {symlinkStatus.resolvedTargetPath ?? "Not linked"}
                </p>
              </div>
            </div>
          ) : null}
          {symlinkError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {symlinkError}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <FrameworkMediaBrowser />
    </div>
  )
}
