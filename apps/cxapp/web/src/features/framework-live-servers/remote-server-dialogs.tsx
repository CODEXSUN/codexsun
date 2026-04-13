import { CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type RemoteServerEditorFormState = {
  name: string
  baseUrl: string
  description: string
  monitorSecret: string
}

type RemoteServerEditorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  isSaving: boolean
  form: RemoteServerEditorFormState
  onFormChange: (nextForm: RemoteServerEditorFormState) => void
  onSubmit: () => void | Promise<void>
}

type RemoteServerGeneratedSecretDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverName: string
  generatedSecret: string
  onCopy: () => void | Promise<void>
}

export function RemoteServerEditorDialog({
  open,
  onOpenChange,
  mode,
  isSaving,
  form,
  onFormChange,
  onSubmit,
}: RemoteServerEditorDialogProps) {
  const isEditMode = mode === "edit"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,34rem)] max-w-[34rem]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Server" : "Add Server"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the saved server target. Paste a monitor secret only when you want to replace the currently saved value for this server."
              : "Save a live server URL first. After that, generate or paste a dedicated monitor secret for that server."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input
              id="server-name"
              value={form.name}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Production Codexsun"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-url">Server URL</Label>
            <Input
              id="server-url"
              value={form.baseUrl}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  baseUrl: event.target.value,
                })
              }
              placeholder="https://app.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-description">Description</Label>
            <Textarea
              id="server-description"
              value={form.description}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  description: event.target.value,
                })
              }
              placeholder="Optional note about this server."
              rows={3}
            />
          </div>
          {isEditMode ? (
            <div className="space-y-2">
              <Label htmlFor="server-monitor-secret">Monitor Secret</Label>
              <Input
                id="server-monitor-secret"
                value={form.monitorSecret}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    monitorSecret: event.target.value,
                  })
                }
                placeholder="Paste SERVER_MONITOR_SHARED_SECRET"
              />
              <p className="text-xs text-muted-foreground">
                Leave this blank to keep the currently saved secret unchanged.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="server-monitor-secret">Monitor Secret</Label>
              <Input
                id="server-monitor-secret"
                value={form.monitorSecret}
                onChange={(event) =>
                  onFormChange({
                    ...form,
                    monitorSecret: event.target.value,
                  })
                }
                placeholder="Paste SERVER_MONITOR_SHARED_SECRET"
              />
              <p className="text-xs text-muted-foreground">
                Paste the remote server&apos;s <code>SERVER_MONITOR_SHARED_SECRET</code> if it is
                already configured. You can also add the server first and save the secret later.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} disabled={isSaving}>
            {isSaving
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Save Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RemoteServerGeneratedSecretDialog({
  open,
  onOpenChange,
  serverName,
  generatedSecret,
  onCopy,
}: RemoteServerGeneratedSecretDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,34rem)] max-w-[34rem]">
        <DialogHeader>
          <DialogTitle>One-Time Secret</DialogTitle>
          <DialogDescription>
            Copy this secret for {serverName}. It is shown only once after generation or
            regeneration. If you lose it, generate a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="generated-monitor-secret">Generated Secret</Label>
            <Input id="generated-monitor-secret" value={generatedSecret} readOnly />
          </div>
          <p className="text-xs text-muted-foreground">
            Set the same value as <code>SERVER_MONITOR_SHARED_SECRET</code> on the remote server,
            then refresh this monitor to confirm the server.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="gap-2" onClick={() => void onCopy()}>
            <CopyIcon className="size-4" />
            Copy Secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
