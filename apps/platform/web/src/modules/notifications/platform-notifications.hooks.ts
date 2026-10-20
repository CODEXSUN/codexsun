import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TopMenuNotification } from "@codexsun/ui/layouts/main-layouts";
import {
  acknowledgeReminder,
  listDueReminders
} from "@codexsun/crm-web/modules/scheduler/services";
import { mapCrmReminderNotification } from "./platform-notifications.mapper";

const crmReminderQueryKey = ["crm-due-reminders"] as const;

export function usePlatformNotifications(crmActive: boolean) {
  const client = useQueryClient();
  const reminders = useQuery({
    queryKey: crmReminderQueryKey,
    queryFn: listDueReminders,
    enabled: crmActive,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });
  const acknowledge = useMutation({
    mutationFn: acknowledgeReminder,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: crmReminderQueryKey }),
        client.invalidateQueries({ queryKey: ["crm-schedules"] })
      ]);
    }
  });

  const notifications: TopMenuNotification[] = crmActive
    ? (reminders.data ?? []).map(mapCrmReminderNotification)
    : [];

  return {
    notifications,
    dismiss: (notificationId: string) => {
      const match = /^crm-schedule:(\d+)$/u.exec(notificationId);
      const scheduleId = Number(match?.[1]);
      if (Number.isSafeInteger(scheduleId) && scheduleId > 0) acknowledge.mutate(scheduleId);
    }
  };
}
