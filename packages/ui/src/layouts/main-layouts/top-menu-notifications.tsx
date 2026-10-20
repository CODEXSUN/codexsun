import { BellIcon, XIcon } from "lucide-react";
import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "../../components/dropdown-menu";
import "./top-menu-notifications.css";

export type TopMenuNotification = {
  body: string;
  id: string;
  title: string;
  onSelect?: () => void;
};

export type TopMenuNotificationsProps = {
  notifications: TopMenuNotification[];
  onDismiss?: (id: string) => void;
};

export function TopMenuNotifications({ notifications, onDismiss }: TopMenuNotificationsProps) {
  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={unreadCount ? `Notifications, ${unreadCount} active` : "Notifications"}
          className="relative size-9 rounded-full"
          size="icon"
          variant="ghost"
        >
          <BellIcon className="size-4" />
          {unreadCount ? <UnreadIndicator /> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[30rem] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl"
        sideOffset={10}
      >
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold">
          Notifications
        </DropdownMenuLabel>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationCard
              body={notification.body}
              key={notification.id}
              {...(onDismiss ? { onDismiss: () => onDismiss(notification.id) } : {})}
              {...(notification.onSelect ? { onSelect: notification.onSelect } : {})}
              title={notification.title}
            />
          ))}
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You have no notifications.
            </p>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UnreadIndicator() {
  return (
    <span className="absolute right-1.5 top-1.5 flex size-2.5" aria-hidden="true">
      <span className="codexsun-notification-ripple" />
      <span className="codexsun-notification-ripple" />
      <span className="codexsun-notification-dot relative inline-flex size-2.5 rounded-full border-2 border-background bg-destructive" />
    </span>
  );
}

function NotificationCard({
  body,
  onDismiss,
  onSelect,
  title
}: {
  body: string;
  onDismiss?: () => void;
  onSelect?: () => void;
  title: string;
}) {
  return (
    <div className="relative flex items-start rounded-xl border bg-background shadow-sm">
      {onSelect ? (
        <button
          className="min-w-0 flex-1 cursor-pointer px-3 py-3 pr-10 text-left"
          onClick={onSelect}
          type="button"
        >
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{body}</span>
        </button>
      ) : (
        <div className="min-w-0 flex-1 px-3 py-3 pr-10">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
      )}
      {onDismiss ? (
        <Button
          aria-label={`Dismiss ${title} notification`}
          className="absolute right-2 top-2 size-7 rounded-full"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDismiss();
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
