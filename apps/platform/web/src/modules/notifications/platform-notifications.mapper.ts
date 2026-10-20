import type { TopMenuNotification } from "@codexsun/ui/layouts/main-layouts";
import {
  sourceLabels,
  type ScheduleRecord,
  type ScheduleSourceType
} from "@codexsun/crm-web/modules/scheduler/services";

export function mapCrmReminderNotification(reminder: ScheduleRecord): TopMenuNotification {
  return {
    id: `crm-schedule:${reminder.id}`,
    title: reminder.title,
    body: `${sourceLabels[reminder.sourceType]} · ${reminder.sourceLabel} · ${new Date(reminder.reminderAt).toLocaleString()}`,
    onSelect: () =>
      window.location.assign(scheduleSourceHref(reminder.sourceType, reminder.sourceId))
  };
}

export function scheduleSourceHref(sourceType: ScheduleSourceType, sourceId: number) {
  switch (sourceType) {
    case "enquiry":
      return `/app/crm/enquiries/${sourceId}`;
    case "task":
      return `/app/crm/tasks/${sourceId}`;
    case "call-log":
      return "/app/crm/call-logs";
    case "duty":
      return "/app/crm/duties";
    case "sop":
      return "/app/crm/sops";
  }
}
