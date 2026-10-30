import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import type { Association } from "./association.types";
import { associationInput } from "./association.schema";
export function AssociationForm({
  record,
  associations: _associations,
  onSave,
  onCancel
}: {
  record: Association | null;
  associations: { uuid: string; name: string }[];
  onSave: (input: Omit<Association, "uuid">, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Omit<Association, "uuid">>(
    record ?? {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      industry: "",
      city: "Tirupur",
      color: "#285d4c",
      initials: "",
      status: "active"
    }
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { uuid: _uuid, ...input } = { uuid: undefined, ...value };
    const parsed = associationInput.safeParse(input);
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
    <WorkspaceFormPanel title={record ? "Edit association" : "New association"}>
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <WorkspaceFormBanner title="Check this association">{error}</WorkspaceFormBanner>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label
            className={`space-y-1 text-sm ${fieldErrors.name ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Name *
            <Input
              required
              value={value.name}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
            />
            {fieldErrors.name ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.name}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.slug ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Slug *
            <Input
              required
              value={value.slug}
              onChange={(event) => setValue({ ...value, slug: event.target.value })}
            />
            {fieldErrors.slug ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.slug}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.tagline ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Tagline
            <Input
              value={value.tagline}
              onChange={(event) => setValue({ ...value, tagline: event.target.value })}
            />
            {fieldErrors.tagline ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.tagline}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.description ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Description *
            <Textarea
              required
              value={value.description}
              onChange={(event) => setValue({ ...value, description: event.target.value })}
              rows={4}
            />
            {fieldErrors.description ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.description}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.industry ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Industry *
            <Input
              required
              value={value.industry}
              onChange={(event) => setValue({ ...value, industry: event.target.value })}
            />
            {fieldErrors.industry ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.industry}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.city ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            City *
            <Input
              required
              value={value.city}
              onChange={(event) => setValue({ ...value, city: event.target.value })}
            />
            {fieldErrors.city ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.city}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.color ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Color *
            <Input
              required
              value={value.color}
              onChange={(event) => setValue({ ...value, color: event.target.value })}
            />
            {fieldErrors.color ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.color}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.initials ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Initials *
            <Input
              required
              value={value.initials}
              onChange={(event) => setValue({ ...value, initials: event.target.value })}
            />
            {fieldErrors.initials ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.initials}
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
