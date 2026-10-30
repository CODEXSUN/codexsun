import { SendIcon, InboxIcon } from "lucide-react";
import type { TopMenuAppItem } from "@codexsun/ui/layouts/main-layouts";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";

export type ChatTelegramPage = "chat.telegram" | "chat.telegram.settings";

export function chatTelegramLauncherItem(active: boolean, onSelect: () => void): TopMenuAppItem {
  return {
    active,
    description: "Telegram account inbox and API connection settings.",
    icon: SendIcon,
    title: "Telegram",
    url: "/app/chat/telegram",
    onSelect
  };
}

export function chatTelegramMenuItems(
  page: string,
  onSelect: (page: ChatTelegramPage) => void
): SidemenuItem[] {
  return [
    {
      title: "Inbox",
      icon: InboxIcon,
      isActive: page === "chat.telegram",
      onSelect: () => onSelect("chat.telegram")
    }
  ];
}
