import { useEffect, useMemo, useState } from "react";
import { MdiMain } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import type { ZetroChatConversation, ZetroChatMessage } from "@codexsun/zetro-contracts";
import { BotIcon, FileTextIcon, LightbulbIcon, MessageSquareIcon, PanelsTopLeftIcon } from "lucide-react";
import { createConversation, getConversation, listConversations, sendMessage } from "./chat-api.js";

export function App() {
  const [conversations, setConversations] = useState<ZetroChatConversation[]>([]);
  const [conversation, setConversation] = useState<ZetroChatConversation>();
  const [messages, setMessages] = useState<ZetroChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadConversations();
  }, []);

  const history = useMemo(
    () => (
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 py-3">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">History</p>
          <div className="flex flex-col gap-1">
            {conversations.map((item) => (
              <Button
                key={item.id}
                className="w-full justify-start truncate"
                size="sm"
                variant={item.id === conversation?.id ? "secondary" : "ghost"}
                onClick={() => void selectConversation(item.id)}
              >
                {item.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    ),
    [conversation?.id, conversations],
  );

  async function loadConversations(): Promise<void> {
    try {
      const items = await listConversations();
      setConversations(items);
      if (items[0]) await selectConversation(items[0].id, items);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(id: string, source = conversations): Promise<void> {
    try {
      const result = await getConversation(id);
      setConversation(result.conversation);
      setMessages(result.messages);
      setConversations(source.map((item) => (item.id === id ? result.conversation : item)));
      setError(undefined);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function startConversation(): Promise<void> {
    try {
      const result = await createConversation();
      setConversations((items) => [result.conversation, ...items]);
      setConversation(result.conversation);
      setMessages([]);
      setError(undefined);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function submit(): Promise<void> {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const current = conversation ?? (await createConversation()).conversation;
      if (!conversation) setConversations((items) => [current, ...items]);
      setDraft("");
      const result = await sendMessage(current.id, content);
      setConversation(result.conversation);
      setMessages(result.messages);
      setConversations((items) => [result.conversation, ...items.filter((item) => item.id !== current.id)]);
      setError(undefined);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setSending(false);
    }
  }

  return (
    <MdiMain
      agentWorkspace={{
        primaryRail: {
          items: [
            { active: true, icon: MessageSquareIcon, id: "chat", label: "Conversation" },
            { icon: LightbulbIcon, id: "ideas", label: "Ideas" },
          ],
          label: "Agent tools",
        },
        secondaryRail: {
          items: [
            { icon: FileTextIcon, id: "brief", label: "Brief" },
          ],
          label: "Agent utilities",
        },
      }}
      applicationIcon={BotIcon}
      applicationId="zetro"
      applicationName="Zetro"
      navigation={[
        {
          items: [
            { active: true, icon: PanelsTopLeftIcon, label: "Idea workspace" },
          ],
        },
      ]}
      primaryAction={{ label: "New conversation", onSelect: () => void startConversation() }}
      sidebarContent={history}
      sidebarFooter={<p className="px-2 text-xs text-muted-foreground">{sending ? "Zetro is thinking" : "Local idea workspace"}</p>}
      sidebarStateKey="codexsun.zetro.sidebar"
      statusLabel={sending ? "Thinking" : "Ready"}
      workspaceTitle="Idea workspace"
    >
      <section className="flex size-full min-h-0 flex-col bg-background">
        <header className="border-b border-border px-6 py-5">
          <p className="text-sm text-muted-foreground">Explore an idea, revise it, then prepare it for a future task.</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{conversation?.title ?? "Start with an idea"}</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
          {loading ? <p className="text-sm text-muted-foreground">Loading conversation history…</p> : null}
          {!loading && messages.length === 0 ? (
            <div className="mx-auto mt-16 max-w-lg text-center">
              <h2 className="text-lg font-medium">What are you working through?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Zetro uses your local Codex session to help you get from a rough idea to a clear brief.</p>
            </div>
          ) : null}
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <article key={message.id} className={message.role === "user" ? "self-end rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "rounded-2xl border border-border bg-card px-4 py-3"}>
                <p className="text-xs font-medium opacity-70">{message.role === "user" ? "You" : message.role === "error" ? "Connection" : "Zetro"}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              </article>
            ))}
          </div>
        </div>
        <footer className="border-t border-border px-6 py-4">
          <div className="mx-auto max-w-3xl">
            {error ? <p className="pb-2 text-sm text-destructive">{error}</p> : null}
            <div className="flex items-end gap-3">
              <Textarea
                aria-label="Message Zetro"
                placeholder="Share an idea, question, or draft…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />
              <Button disabled={!draft.trim() || sending} onClick={() => void submit()}>
                {sending ? "Thinking…" : "Send"}
              </Button>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">Enter sends. Shift + Enter adds a line.</p>
          </div>
        </footer>
      </section>
    </MdiMain>
  );
}

function messageFor(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Zetro could not complete that request.";
}
