import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Label } from "@codexsun/ui/components/label";
import {
  WorkspaceFormActions,
  WorkspaceFormBody,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
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
import {
  createSop,
  updateSop,
  listSops,
  listSopItems,
  createSopItem,
  updateSopItem,
  createSopRevision,
  updateSopRevision,
  publishSopItem,
  type SopItem
} from "./sop.services";

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Yearly" }
] as const;
export function SopSimpleForm({
  record,
  onClose
}: {
  record: SopItem | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [name, setName] = useState(record?.title ?? "");
  const [department, setDepartment] = useState(record?.department ?? "");
  const [frequency, setFrequency] = useState(record?.frequency ?? "daily");
  const [steps, setSteps] = useState(record?.currentRevision?.instructions ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const progress = useRef<{ parentId?: number; item?: SopItem; revisionId?: number }>({
    ...(record ? { parentId: record.sopId, item: record } : {})
  });
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const state = progress.current;
      if (!state.parentId)
        state.parentId = (
          await createSop({
            code: `SOP-${crypto.randomUUID().slice(0, 12)}`,
            title: name.trim(),
            purpose: name.trim()
          })
        ).id;
      if (record && name.trim() !== record.title) {
        const [headers, items] = await Promise.all([listSops(), listSopItems()]);
        const parent = headers.find((sop) => sop.id === record.sopId);
        if (
          parent?.title === record.title &&
          items.filter((item) => item.sopId === record.sopId).length === 1
        ) {
          await updateSop(parent.id, {
            code: parent.code,
            title: name.trim(),
            purpose: parent.purpose
          });
        }
      }
      const revision = {
        instructions: steps.trim(),
        evidenceGuidance: record?.currentRevision?.evidenceGuidance ?? ""
      };
      if (!state.item)
        state.item = await createSopItem({
          sopId: state.parentId,
          code: `ITEM-${crypto.randomUUID().slice(0, 12)}`,
          title: name.trim(),
          department: department.trim(),
          frequency: frequency as "daily",
          sortOrder: 1000,
          revision
        });
      else
        state.item = await updateSopItem(state.item.id, {
          sopId: state.item.sopId,
          code: state.item.code,
          title: name.trim(),
          department: department.trim(),
          frequency,
          sortOrder: state.item.sortOrder
        });
      if (!state.revisionId) {
        if (state.item.currentRevision?.status === "draft")
          state.revisionId = state.item.currentRevision.id;
        else state.revisionId = (await createSopRevision(state.item.id, revision)).id;
      }
      await updateSopRevision(state.item.id, state.revisionId, revision);
      await publishSopItem(state.item.id, state.revisionId);
      await client.invalidateQueries({ queryKey: ["crm", "sop-items"] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save SOP.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceUpsertPage title={record ? "Edit SOP" : "New SOP"}>
      <form onSubmit={(event) => void save(event)}>
        <WorkspaceFormSurface>
          <WorkspaceFormBody className="space-y-5">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="simple-sop-name">
                  SOP name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="simple-sop-name"
                  autoFocus
                  required
                  maxLength={191}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simple-sop-department">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="simple-sop-department"
                  required
                  maxLength={120}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simple-sop-frequency">
                  Frequency <span className="text-destructive">*</span>
                </Label>
                <select
                  id="simple-sop-frequency"
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  {!frequencies.some((option) => option.value === frequency) ? (
                    <option value={frequency}>{frequency}</option>
                  ) : null}
                  {frequencies.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="simple-sop-steps">
                Steps <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="simple-sop-steps"
                required
                className="min-h-48"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
              />
            </div>
          </WorkspaceFormBody>
          <WorkspaceFormActions>
            <Button disabled={busy}>{busy ? "Saving..." : "Save SOP"}</Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setLeaving(true)}
            >
              Cancel
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
