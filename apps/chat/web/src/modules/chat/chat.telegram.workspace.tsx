import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { ChatWorkspace } from "./chat.workspace";
import { listTelegramConversations } from "./chat.telegram.services";

export function ChatTelegramWorkspace({
  currentUserEmail,
  onOpenSettings
}: {
  currentUserEmail: string;
  onOpenSettings: () => void;
}) {
  const conversations = useQuery({
    queryKey: ["chat", "telegram", "conversations"],
    queryFn: listTelegramConversations,
    refetchInterval: 15_000
  });
  if (conversations.isPending)
    return (
      <p className="p-6" role="status">
        Loading Telegram conversations…
      </p>
    );
  if (conversations.isError)
    return (
      <div className="p-6">
        <WorkspaceFormBanner title="Telegram inbox could not load">
          {conversations.error.message}
        </WorkspaceFormBanner>
        <Button variant="outline" onClick={() => void conversations.refetch()}>
          Try again
        </Button>
      </div>
    );
  if (!conversations.data.length)
    return (
      <WorkspacePage
        title="Telegram"
        description="Send and receive Telegram account messages inside CODEXSUN."
        technicalName="page.chat.telegram"
      >
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Connect your Telegram account</h2>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Add your API ID and API hash in Settings, sign in with your phone number, then link the
            conversations you want to sync with Chat.
          </p>
          <Button onClick={onOpenSettings}>Open Telegram Settings</Button>
        </section>
      </WorkspacePage>
    );
  return (
    <ChatWorkspace
      title="Telegram"
      currentUserEmail={currentUserEmail}
      channelUuids={conversations.data.map((item) => item.channelUuid)}
      onConfigure={onOpenSettings}
    />
  );
}
