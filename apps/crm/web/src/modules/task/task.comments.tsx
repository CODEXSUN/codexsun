import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CornerUpLeft, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceMinimalEditor } from "@codexsun/ui/workspace/minimal-editor";
import { formatDate } from "@codexsun/ui/workspace/utils";
import type { TaskComment } from "./task.types";

export function TaskComments({
  comments,
  loading,
  error,
  canRespond,
  onAdd
}: {
  comments: TaskComment[];
  loading: boolean;
  error?: string | undefined;
  canRespond: boolean;
  onAdd: (body: string, parentId: number | null) => Promise<unknown>;
}) {
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const retry = useRef<{ body: string; parentId: number | null } | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const save = useMutation({
    mutationFn: () => {
      if (retry.current?.body !== body || retry.current.parentId !== replyTo)
        retry.current = { body, parentId: replyTo };
      return onAdd(retry.current.body, retry.current.parentId);
    },
    onSuccess: () => {
      setBody("");
      setReplyTo(null);
      retry.current = null;
      toast.success("Comment added");
    },
    onError: (failure) => toast.error("Unable to add comment", { description: failure.message })
  });
  const topLevel = comments.filter((item) => item.parentId === null);
  const latestId = topLevel.at(-1)?.id ?? null;
  const activeReplyTo = replyTo === latestId ? replyTo : null;
  const canSave = hasText(body) && !save.isPending;

  return (
    <section className="flex min-h-[34rem] flex-col bg-card">
      <div className="border-b border-border/70 px-4 py-2 text-xs text-muted-foreground">
        {topLevel.length} {topLevel.length === 1 ? "comment" : "comments"} ·{" "}
        {comments.length - topLevel.length}{" "}
        {comments.length - topLevel.length === 1 ? "reply" : "replies"}
      </div>
      <div className="min-h-0 flex-1 px-4 py-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading comments…</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {!loading && !error && comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : null}
        {comments.map((item) => (
          <article
            key={item.uuid}
            className={`border-b border-border/60 py-3 last:border-b-0 ${item.parentId ? "ml-8 border-l-2 pl-3" : ""}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full border border-border p-1.5 text-muted-foreground">
                {item.parentId ? (
                  <CornerUpLeft className="size-3" />
                ) : (
                  <MessageSquare className="size-3" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words rounded-md bg-muted/25 px-3 py-2 text-sm">
                  {plainText(item.body)}
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-end gap-4 text-xs text-muted-foreground">
                  {item.id === latestId && canRespond ? (
                    <Button
                      className="mr-auto h-7 px-2.5 text-xs"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => setReplyTo(item.id)}
                    >
                      Reply
                    </Button>
                  ) : null}
                  <span className="text-right">
                    {formatByline(item.createdBy, item.createdAt, now)}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {canRespond ? (
        <div className="border-t border-border/70 bg-card p-3">
          {activeReplyTo ? (
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Replying to comment #{activeReplyTo}</span>
              <button
                className="cursor-pointer text-primary hover:underline"
                type="button"
                onClick={() => setReplyTo(null)}
              >
                Cancel reply
              </button>
            </div>
          ) : null}
          <WorkspaceMinimalEditor
            className="[&_.tiptap]:min-h-24"
            content={body}
            placeholder={activeReplyTo ? "Write a reply…" : "Write a comment…"}
            onChange={setBody}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button disabled={!canSave} size="sm" type="button" onClick={() => save.mutate()}>
              {activeReplyTo ? <CornerUpLeft className="size-4" /> : <Send className="size-4" />}
              {activeReplyTo ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function hasText(html: string) {
  if (!html) return false;
  return Boolean(new DOMParser().parseFromString(html, "text/html").body.textContent?.trim());
}

function plainText(value: string) {
  if (!/<\/?[a-z][^>]*>/iu.test(value)) return value;
  return (
    new DOMParser()
      .parseFromString(value.replace(/<\/(p|li|div)>/giu, "</$1>\n"), "text/html")
      .body.textContent?.trim() ?? ""
  );
}

function formatByline(author: string, createdAt: string | Date, now: number) {
  const name = author.match(/@([^@.]+)(?:\.|$)/u)?.[1] || author;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return name;
  const elapsed = Math.trunc((now - date.getTime()) / 60_000);
  const absolute = Math.abs(elapsed);
  const unit =
    absolute < 1
      ? "just now"
      : absolute < 60
        ? `${absolute}m`
        : absolute < 1440
          ? `${Math.floor(absolute / 60)}h`
          : absolute < 43200
            ? `${Math.floor(absolute / 1440)}d`
            : absolute < 525600
              ? `${Math.floor(absolute / 43200)}mo`
              : `${Math.floor(absolute / 525600)}y`;
  return `${name} · (${formatDate(date)}) . ${elapsed < 0 ? `in ${unit}` : `${unit} ago`}`;
}
