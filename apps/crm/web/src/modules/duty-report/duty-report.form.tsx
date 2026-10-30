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
import { Textarea } from "@codexsun/ui/components/textarea";
import { Label } from "@codexsun/ui/components/label";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceUpsertPage,
  WorkspaceFormSurface,
  WorkspaceFormBody,
  WorkspaceFormActions
} from "@codexsun/ui/workspace/upsert";
import type { DutyAssignment } from "../duty-assignment";
import type { DutyReport } from "./duty-report.services";
export function DutyReportForm({
  record,
  duties,
  readOnly,
  busy,
  error,
  onSave,
  onClose
}: {
  record: DutyReport | null;
  duties: DutyAssignment[];
  readOnly: boolean;
  busy: boolean;
  error: string;
  onSave: (value: { assignmentId: number; performedDate: string; actions: string }) => void;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<number | null>(record?.assignmentId ?? null);
  const [date, setDate] = useState(record?.performedDate ?? new Date().toISOString().slice(0, 10));
  const [actions, setActions] = useState(record?.actions ?? "");
  const duty = duties.find((row) => row.id === assignmentId);
  return (
    <WorkspaceUpsertPage
      title={readOnly ? "Duty report" : record ? "Edit duty report" : "New duty report"}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (assignmentId) onSave({ assignmentId, performedDate: date, actions });
        }}
      >
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
                {record ? (
                  <Input aria-label="SOP" value={record.itemTitle} readOnly />
                ) : (
                  <WorkspaceLookup
                    ariaLabel="SOP"
                    value={assignmentId ? String(assignmentId) : ""}
                    options={duties.map((row) => ({ value: String(row.id), label: row.itemTitle }))}
                    onValueChange={(id) => setAssignmentId(id ? Number(id) : null)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-user">User</Label>
                <Input
                  id="report-user"
                  readOnly
                  value={record?.assigneeName ?? duty?.assigneeName ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-date">Date *</Label>
                <Input
                  id="report-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="report-actions">Actions *</Label>
                <Textarea
                  id="report-actions"
                  className="min-h-36"
                  required
                  maxLength={10000}
                  value={actions}
                  onChange={(e) => setActions(e.target.value)}
                />
              </div>
            </fieldset>
            <div className="grid gap-4 border-t pt-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Department</p>
                <p>{record?.department ?? duty?.department ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Frequency</p>
                <p className="capitalize">
                  {(record?.frequency ?? duty?.frequency) === "annually"
                    ? "Yearly"
                    : (record?.frequency ?? duty?.frequency ?? "-")}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Steps</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {record?.instructions ?? duty?.instructions ?? "-"}
                </p>
              </div>
            </div>
          </WorkspaceFormBody>
          <WorkspaceFormActions>
            {!readOnly ? (
              <Button disabled={busy || !assignmentId}>{busy ? "Saving..." : "Save report"}</Button>
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
