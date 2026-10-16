import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceLookup, WorkspaceFormField } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { listChannels } from "./chat.services";
import { ChatTelegramAccountSettings } from "./chat.telegram.settings";
import { useChatTelegram, useTelegramDialogs } from "./chat.telegram.hooks";

export function ChatTelegramSettingsWorkspace({
  onCreateConversation
}: {
  onCreateConversation: () => void;
}) {
  const telegram = useChatTelegram();
  const connected = telegram.account.data?.authState === "connected";
  const dialogs = useTelegramDialogs(connected);
  const channels = useQuery({
    queryKey: ["chat", "channels", "telegram-settings"],
    queryFn: () => listChannels(),
    enabled: connected
  });
  const [dialogUuid, setDialogUuid] = useState("");
  const [channelUuid, setChannelUuid] = useState("");
  const [error, setError] = useState("");
  async function link(id = dialogUuid, channel: string | null = channelUuid) {
    if (!id || channel === "") {
      setError("Choose both a Telegram conversation and a Chat conversation.");
      return;
    }
    try {
      setError("");
      await telegram.link.mutateAsync({ dialogUuid: id, channelUuid: channel });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not link this Telegram conversation."
      );
    }
  }
  return (
    <WorkspacePage
      title="Telegram Settings"
      description="Sign in with Telegram API credentials and connect your conversations to Chat."
      technicalName="page.chat.telegram.settings"
    >
      <div className="grid max-w-2xl gap-5">
        <ChatTelegramAccountSettings />
        {connected && (
          <section className="grid gap-4 rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">Link a Telegram conversation to Chat</h2>
            <p className="text-sm text-muted-foreground">
              New text messages will sync in both directions. Linking shares them with the selected
              Chat conversation's participants. Only conversation admins can create links.
            </p>
            {(error || dialogs.error || channels.error || telegram.refresh.error) && (
              <WorkspaceFormBanner title="Conversation settings need attention">
                {error ||
                  dialogs.error?.message ||
                  channels.error?.message ||
                  telegram.refresh.error?.message}
              </WorkspaceFormBanner>
            )}
            <WorkspaceFormField label="Telegram conversation" required>
              <WorkspaceLookup
                value={dialogUuid}
                onValueChange={setDialogUuid}
                allowTextValue={false}
                placeholder="Search Telegram conversations"
                options={(dialogs.data ?? []).map((dialog) => ({
                  value: dialog.uuid,
                  label: dialog.title
                }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Chat conversation" required>
              <WorkspaceLookup
                value={channelUuid}
                onValueChange={setChannelUuid}
                allowTextValue={false}
                placeholder="Search Chat conversations"
                options={(channels.data ?? [])
                  .filter((channel) => channel.status === "active")
                  .map((channel) => ({ value: channel.uuid, label: channel.name }))}
              />
            </WorkspaceFormField>
            <div className="flex flex-wrap gap-2">
              <Button disabled={telegram.link.isPending} onClick={() => void link()}>
                Link conversations
              </Button>
              <Button
                variant="outline"
                disabled={telegram.refresh.isPending}
                onClick={() => telegram.refresh.mutate()}
              >
                Refresh Telegram conversations
              </Button>
              <Button variant="outline" onClick={onCreateConversation}>
                Create a conversation in Chat
              </Button>
            </div>
            {(dialogs.data ?? [])
              .filter((dialog) => dialog.channelUuid)
              .map((dialog) => (
                <div
                  key={dialog.uuid}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <span>
                    {dialog.title} →{" "}
                    {channels.data?.find((channel) => channel.uuid === dialog.channelUuid)?.name ??
                      "Chat conversation"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={telegram.link.isPending}
                    onClick={() => void link(dialog.uuid, null)}
                  >
                    Unlink
                  </Button>
                </div>
              ))}
            <p className="text-xs text-muted-foreground">
              Refresh loads up to 100 recent Telegram conversations. Files, edits, deletions, and
              full history imports are not included in this version.
            </p>
          </section>
        )}
      </div>
    </WorkspacePage>
  );
}
