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
import { toast } from "sonner";
import { createSchedule, type ScheduleSourceType } from "./scheduler.services";

export function ScheduleRecordButton({
  sourceType,
  sourceId,
  sourceLabel,
  onClick
}: {
  sourceType: ScheduleSourceType;
  sourceId: number;
  sourceLabel: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const idPrefix = useId().replaceAll(":", "");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Follow up · ${sourceLabel}`.slice(0, 191));
  const [details, setDetails] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const create = useMutation({
    mutationFn: createSchedule,
    onSuccess: async () => {
      toast.success("Reminder scheduled");
      setOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["crm-schedules"] }),
        queryClient.invalidateQueries({ queryKey: ["crm-due-reminders"] })
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not schedule reminder")
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !scheduledAt || !reminderAt) {
      toast.error("Enter a title, schedule time, and reminder time.");
      return;
    }
    create.mutate({
      title: title.trim(),
      details: details.trim(),
      sourceType,
      sourceId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      reminderAt: new Date(reminderAt).toISOString()
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        aria-label="Schedule"
        title="Schedule"
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
          setTitle(`Follow up · ${sourceLabel}`.slice(0, 191));
          setDetails("");
          setScheduledAt("");
          setReminderAt("");
          setOpen(true);
        }}
      >
        <CalendarPlusIcon className="size-4" /> Schedule
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>Linked to {sourceLabel}.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-title-${sourceType}-${sourceId}-${idPrefix}`}>Title</Label>
            <Input
              id={`schedule-title-${sourceType}-${sourceId}-${idPrefix}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={191}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`schedule-time-${sourceType}-${sourceId}-${idPrefix}`}>
                Scheduled for
              </Label>
              <Input
                id={`schedule-time-${sourceType}-${sourceId}-${idPrefix}`}
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => {
                  setScheduledAt(event.target.value);
                  if (!reminderAt) setReminderAt(event.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`reminder-time-${sourceType}-${sourceId}-${idPrefix}`}>
                Remind me at
              </Label>
              <Input
                id={`reminder-time-${sourceType}-${sourceId}-${idPrefix}`}
                type="datetime-local"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-details-${sourceType}-${sourceId}-${idPrefix}`}>
              Details (optional)
            </Label>
            <Input
              id={`schedule-details-${sourceType}-${sourceId}-${idPrefix}`}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={10000}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-violet-700 hover:bg-violet-800"
            >
              {create.isPending ? "Saving…" : "Save reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
