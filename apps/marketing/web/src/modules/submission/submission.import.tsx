import { useState } from "react";
import { z } from "zod";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceUpsertDialog, WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import { submissionSchema } from "./submission.schema";
import { saveSubmission } from "./submission.services";
import type { SubmissionInput } from "./submission.types";
export function SubmissionImport({
  onClose,
  onSaved
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useMarketingTransport();
  const [rows, setRows] = useState<SubmissionInput[]>([]),
    [issue, setIssue] = useState(""),
    [running, setRunning] = useState(false),
    [completed, setCompleted] = useState(0);
  async function preview(file: File | undefined) {
    setRows([]);
    setIssue("");
    setCompleted(0);
    if (!file) return;
    if (file.size > 262144) {
      setIssue("Use a JSON file smaller than 256 KB.");
      return;
    }
    try {
      const parsed = z
        .array(submissionSchema)
        .min(1)
        .max(100)
        .parse(JSON.parse(await file.text()));
      if (
        new Set(parsed.map((row) => row.captureUuid + ":" + row.sourceKey)).size !== parsed.length
      )
        throw new Error("Duplicate capture/source keys in the file.");
      setRows(parsed);
    } catch (error) {
      setIssue(error instanceof Error ? error.message : "Unable to read the import.");
    }
  }
  async function run() {
    setRunning(true);
    setIssue("");
    try {
      for (let index = completed; index < rows.length; index++) {
        await saveSubmission(api, rows[index]!);
        setCompleted(index + 1);
      }
      onSaved();
    } catch (error) {
      setIssue(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setRunning(false);
    }
  }
  return (
    <WorkspaceUpsertDialog
      open
      onClose={() => {
        if (!running) onClose();
      }}
      title="Import submissions"
      description="Validate a fixed JSON mapping before writing any records."
    >
      <div className="space-y-4 p-4">
        <p className="text-sm">
          Fields: captureUuid, sourceKey, name, email, phone, message, privacyConsent. Use an active
          capture form UUID and a stable source key. Privacy consent does not grant promotional
          consent.
        </p>
        <Input
          type="file"
          accept=".json,application/json"
          disabled={running}
          onChange={(event) => void preview(event.target.files?.[0])}
        />
        {issue ? (
          <WorkspaceFormBanner tone="error" title="Import requires review">
            {issue}
          </WorkspaceFormBanner>
        ) : null}
        <p>
          {rows.length} validated rows. {completed} saved.
        </p>
        {rows.slice(0, 10).map((row) => (
          <p key={row.sourceKey} className="text-sm">
            {row.name} · {row.email || row.phone}
          </p>
        ))}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={running} onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!rows.length || running || completed === rows.length}
            onClick={() => void run()}
          >
            {running ? "Importing…" : "Import validated rows"}
          </Button>
        </div>
      </div>
    </WorkspaceUpsertDialog>
  );
}
