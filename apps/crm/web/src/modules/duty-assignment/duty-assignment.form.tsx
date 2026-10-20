import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@codexsun/ui/components/alert-dialog";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceUpsertPage,
  WorkspaceFormSurface,
  WorkspaceFormBody,
  WorkspaceFormActions
} from "@codexsun/ui/workspace/upsert";
import type { SopItem } from "../sop";
import { ScheduleRecordButton } from "../scheduler";
import type { DutyAssignment, DutyAssignmentInput } from "./duty-assignment.services";
export function DutyAssignmentForm({
  record,
  items,
  users,
  readOnly,
  busy,
  error,
  onSave,
  onClose
}: {
  record: DutyAssignment | null;
  items: SopItem[];
  users: Array<{ id: number; name: string }>;
  readOnly: boolean;
  busy: boolean;
  error: string;
  onSave: (value: DutyAssignmentInput) => void;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [sopId, setSopId] = useState(record?.sopItemId ?? (null as number | null));
  const [userId, setUserId] = useState(record?.assigneeUserId ?? (null as number | null));
  const [order, setOrder] = useState(record?.displayOrder ?? 1);
  const item = items.find((item) => item.id === sopId);
  const selectedIsOriginal = record?.sopItemId === sopId;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sopId || !userId) return;
    const revisionId = selectedIsOriginal ? record!.revisionId : item?.currentRevision?.id;
    if (!revisionId) return;
    onSave({
      sopItemId: sopId,
      revisionId,
      assigneeUserId: userId,
      displayOrder: order,
      startDate: record?.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: record?.endDate ?? null
    });
  }
  return (
    <WorkspaceUpsertPage
      title={readOnly ? "Duty" : record ? "Edit duty" : "New duty"}
      action={
        record ? (
          <ScheduleRecordButton
            sourceType="duty"
            sourceId={record.id}
            sourceLabel={`Duty · ${record.itemTitle} · ${record.assigneeName}`}
          />
        ) : undefined
      }
    >
      <form onSubmit={submit}>
        <WorkspaceFormSurface>
          <WorkspaceFormBody className="space-y-5">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <fieldset disabled={readOnly || busy} className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>SOP *</Label>
                {readOnly ? (
                  <Input aria-label="SOP" value={record?.itemTitle ?? ""} readOnly />
                ) : (
                  <WorkspaceLookup
                    ariaLabel="SOP"
                    value={sopId ? String(sopId) : ""}
                    options={items
                      .filter(
                        (item) =>
                          item.currentRevision?.status === "published" ||
                          item.id === record?.sopItemId
                      )
                      .map((item) => ({ value: String(item.id), label: item.title }))}
                    onValueChange={(id) => setSopId(id ? Number(id) : null)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>User *</Label>
                <WorkspaceLookup
                  ariaLabel="User"
                  value={userId ? String(userId) : ""}
                  options={users.map((user) => ({ value: String(user.id), label: user.name }))}
                  onValueChange={(id) => setUserId(id ? Number(id) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duty-index">Index *</Label>
                <Input
                  id="duty-index"
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </fieldset>
            <div className="grid gap-4 border-t pt-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Department</p>
                <p>{item?.department ?? record?.department ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Frequency</p>
                <p className="capitalize">
                  {item?.frequency === "annually"
                    ? "Yearly"
                    : (item?.frequency ?? record?.frequency ?? "-")}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Steps</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selectedIsOriginal
                    ? record?.instructions
                    : (item?.currentRevision?.instructions ?? "-")}
                </p>
              </div>
            </div>
          </WorkspaceFormBody>
          <WorkspaceFormActions>
            {!readOnly ? (
              <Button disabled={busy || !sopId || !userId}>
                {busy ? "Saving..." : "Save duty"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => (readOnly ? onClose() : setLeaving(true))}
            >
              {readOnly ? "Back" : "Cancel"}
            </Button>
          </WorkspaceFormActions>
        </WorkspaceFormSurface>
      </form>
      <AlertDialog open={leaving} onOpenChange={setLeaving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keep or discard changes?</AlertDialogTitle>
            <AlertDialogDescription>Your changes have not been saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceUpsertPage>
  );
}
