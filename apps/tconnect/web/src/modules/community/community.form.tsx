import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceLookup, WorkspaceSelect } from "@codexsun/ui/workspace";
import type { CommunityPost } from "./community.types";
import { communityInput } from "./community.schema";
export function CommunityForm({
  record,
  associations,
  onSave,
  onCancel
}: {
  record: CommunityPost | null;
  associations: { uuid: string; name: string }[];
  onSave: (input: Omit<CommunityPost, "uuid">, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Omit<CommunityPost, "uuid">>(
    record ?? {
      title: "",
      body: "",
      category: "knowledge",
      associationUuid: "",
      eventDate: null,
      status: "active"
    }
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { uuid: _uuid, ...input } = { uuid: undefined, ...value };
    const parsed = communityInput.safeParse(input);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      setError(
        parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" ")
      );
      return;
    }
    setFieldErrors({});
    setBusy(true);
    setError("");
    try {
      await onSave(parsed.data, record?.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title={record ? "Edit community" : "New community"}>
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <WorkspaceFormBanner title="Check this community">{error}</WorkspaceFormBanner>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label
            className={`space-y-1 text-sm ${fieldErrors.title ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Title *
            <Input
              required
              value={value.title}
              onChange={(event) => setValue({ ...value, title: event.target.value })}
            />
            {fieldErrors.title ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.title}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.body ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Body *
            <Textarea
              required
              value={value.body}
              onChange={(event) => setValue({ ...value, body: event.target.value })}
              rows={4}
            />
            {fieldErrors.body ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.body}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.category ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Category *
            <WorkspaceSelect
              ariaLabel="Category"
              value={value.category}
              onValueChange={(next) =>
                setValue({ ...value, category: next as typeof value.category })
              }
              options={[
                { value: "knowledge", label: "Knowledge" },
                { value: "event", label: "Event" },
                { value: "opportunity", label: "Opportunity" },
                { value: "announcement", label: "Announcement" }
              ]}
            />
            {fieldErrors.category ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.category}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.associationUuid ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Association *
            <WorkspaceLookup
              ariaLabel="Association"
              allowTextValue={false}
              value={value.associationUuid}
              onValueChange={(next) => setValue({ ...value, associationUuid: next })}
              options={associations.map((item) => ({ value: item.uuid, label: item.name }))}
            />
            {fieldErrors.associationUuid ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.associationUuid}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.eventDate ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Event date
            <Input
              type="date"
              value={value.eventDate ?? ""}
              onChange={(event) => setValue({ ...value, eventDate: event.target.value || null })}
            />
            {fieldErrors.eventDate ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.eventDate}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.status ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Status *
            <WorkspaceSelect
              ariaLabel="Status"
              value={value.status}
              onValueChange={(next) => setValue({ ...value, status: next as typeof value.status })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
            {fieldErrors.status ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.status}
              </span>
            ) : null}
          </label>
        </div>
        <div className="flex gap-3">
          <Button disabled={busy} type="submit">
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
