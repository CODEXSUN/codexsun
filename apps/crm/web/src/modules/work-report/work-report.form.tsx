import { Button } from "@codexsun/ui/components/button";
import { WorkspaceMinimalEditor } from "@codexsun/ui/workspace/minimal-editor";
import { RefreshCw, Send } from "lucide-react";
import type { ReactNode } from "react";
export function WorkReportForm({
  body,
  onChange,
  onSubmit,
  pending,
  onComment,
  onJob,
  onWhatsApp,
  afterWhatsApp,
  onRequestClosure,
  jobRunning = false,
  jobPending = false,
  active = true,
  onRefresh,
  checkedIn,
  checkpointPending
}: {
  active?: boolean;
  checkedIn: boolean;
  checkpointPending: boolean;
  body: string;
  onChange: (value: string) => void;
  onSubmit: (action: "check-in" | "check-out") => void;
  pending: boolean;
  onComment?: (() => void) | undefined;
  onJob?: (() => void) | undefined;
  onWhatsApp?: (() => void) | undefined;
  afterWhatsApp?: ReactNode;
  onRequestClosure?: (() => void) | undefined;
  jobRunning?: boolean | undefined;
  jobPending?: boolean | undefined;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={pending ? "pointer-events-none opacity-60" : undefined} aria-busy={pending}>
        <WorkspaceMinimalEditor
          autoFocus={active}
          className="[&_.tiptap]:min-h-24"
          content={body}
          placeholder="Write a comment…"
          onChange={onChange}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {onComment ? (
          <Button disabled={pending || !hasCommentText(body)} onClick={onComment}>
            <Send className="size-4" /> Comment
          </Button>
        ) : null}
        <Button
          variant={checkedIn ? "default" : "outline"}
          aria-pressed={checkedIn}
          disabled={pending || checkpointPending}
          onClick={() => onSubmit(checkedIn ? "check-out" : "check-in")}
        >
          {checkedIn ? "Check out" : "Check in"}
        </Button>
        {onJob ? (
          <Button
            variant={jobRunning ? "default" : "outline"}
            aria-pressed={jobRunning}
            disabled={pending || jobPending}
            onClick={onJob}
          >
            {jobRunning ? "Stop job" : "Start job"}
          </Button>
        ) : null}
        {onWhatsApp ? (
          <Button variant="outline" disabled={pending} onClick={onWhatsApp}>
            WhatsApp
          </Button>
        ) : null}
        {afterWhatsApp}
        {onRequestClosure ? (
          <Button variant="outline" disabled={pending} onClick={onRequestClosure}>
            Request closure
          </Button>
        ) : null}
        <Button
          className="ml-auto size-8 p-0"
          variant="outline"
          aria-label="Refresh actions"
          title="Refresh actions"
          disabled={pending}
          onClick={onRefresh}
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function hasCommentText(html: string) {
  return Boolean(new DOMParser().parseFromString(html, "text/html").body.textContent?.trim());
}
