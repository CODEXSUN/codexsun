import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import { toast } from "sonner";
import { createSchedule, type ScheduleSourceType } from "./scheduler.services";

export function ScheduleRecordButton({
  sourceType,
  sourceId,
  sourceLabel,
  label = "Schedule",
  onClick
}: {
  sourceType: ScheduleSourceType;
  sourceId: number;
  sourceLabel: string;
  label?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const idPrefix = useId().replaceAll(":", "");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const create = useMutation({
    mutationFn: createSchedule,
    onSuccess: async () => {
      toast.success("Schedule saved");
      setOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["crm-schedules"] }),
        queryClient.invalidateQueries({ queryKey: ["crm-due-reminders"] })
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save schedule")
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notes.trim() || !scheduledAt) {
      toast.error("Enter notes and a schedule date and time.");
      return;
    }
    create.mutate({
      notes: notes.trim(),
      sourceType,
      sourceId,
      scheduledAt: new Date(scheduledAt).toISOString()
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
          setNotes("");
          setScheduledAt("");
          setOpen(true);
        }}
      >
        <CalendarPlusIcon className="size-4" /> {label}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New schedule</DialogTitle>
          <DialogDescription>Linked to {sourceLabel}.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-time-${sourceType}-${sourceId}-${idPrefix}`}>
              Scheduled for
            </Label>
            <Input
              id={`schedule-time-${sourceType}-${sourceId}-${idPrefix}`}
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-notes-${sourceType}-${sourceId}-${idPrefix}`}>Notes</Label>
            <Textarea
              id={`schedule-notes-${sourceType}-${sourceId}-${idPrefix}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={10000}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-violet-700 hover:bg-violet-800"
            >
              {create.isPending ? "Saving…" : "Save schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
