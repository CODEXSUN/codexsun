import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceLookup, WorkspaceSelect } from "@codexsun/ui/workspace";
import type { Company } from "./company.types";
import { companyInput } from "./company.schema";
export function CompanyForm({
  record,
  associations,
  onSave,
  onCancel,
  memberOwned = false
}: {
  record: Company | null;
  memberOwned?: boolean;
  associations: { uuid: string; name: string }[];
  onSave: (input: Omit<Company, "uuid">, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Omit<Company, "uuid">>(
    record ?? {
      logoDataUrl: "",
      name: "",
      slug: "",
      tagline: "",
      description: "",
      industry: "",
      city: "Tirupur",
      color: "#285d4c",
      initials: "",
      role: "supplier",
      products: "",
      capacity: "",
      established: 2026,
      associationUuid: null,
      website: "",
      status: "active"
    }
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { uuid: _uuid, ...input } = { uuid: undefined, ...value };
    const parsed = companyInput.safeParse(input);
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
    <WorkspaceFormPanel title={record ? "Edit company" : "New company"}>
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <WorkspaceFormBanner title="Check this company">{error}</WorkspaceFormBanner>
        ) : null}
        <div className="space-y-2">
          <label className="block text-sm">
            Company logo (PNG, JPEG or WebP, up to 150 KB)
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 150000) {
                  setError("Choose an image smaller than 150 KB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string")
                    setValue({ ...value, logoDataUrl: reader.result });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {value.logoDataUrl ? (
            <div className="flex items-center gap-3">
              <img
                className="h-20 w-20 rounded object-contain"
                src={value.logoDataUrl}
                alt="Company logo preview"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setValue({ ...value, logoDataUrl: "" })}
              >
                Remove logo
              </Button>
            </div>
          ) : null}
        </div>
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
            className={`space-y-1 text-sm ${fieldErrors.role ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Role *
            <WorkspaceSelect
              ariaLabel="Role"
              value={value.role}
              onValueChange={(next) => setValue({ ...value, role: next as typeof value.role })}
              options={[
                { value: "manufacturer", label: "Manufacturer" },
                { value: "supplier", label: "Supplier" },
                { value: "buyer", label: "Buyer" },
                { value: "service", label: "Service" }
              ]}
            />
            {fieldErrors.role ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.role}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.products ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Products *
            <Input
              required
              value={value.products}
              onChange={(event) => setValue({ ...value, products: event.target.value })}
            />
            {fieldErrors.products ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.products}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.capacity ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Capacity
            <Input
              value={value.capacity}
              onChange={(event) => setValue({ ...value, capacity: event.target.value })}
            />
            {fieldErrors.capacity ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.capacity}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.established ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Established year *
            <Input
              type="number"
              required
              min={1900}
              max={2100}
              value={value.established}
              onChange={(event) => setValue({ ...value, established: Number(event.target.value) })}
            />
            {fieldErrors.established ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.established}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.associationUuid ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Association
            <WorkspaceLookup
              disabled={memberOwned}
              ariaLabel="Association"
              allowTextValue={false}
              value={value.associationUuid ?? ""}
              onValueChange={(next) => setValue({ ...value, associationUuid: next || null })}
              options={associations.map((item) => ({ value: item.uuid, label: item.name }))}
            />
            {fieldErrors.associationUuid ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.associationUuid}
              </span>
            ) : null}
          </label>
          <label
            className={`space-y-1 text-sm ${fieldErrors.website ? "text-red-700 [&_input]:border-red-600 [&_textarea]:border-red-600 [&_button]:border-red-600" : ""}`}
          >
            Website
            <Input
              value={value.website}
              onChange={(event) => setValue({ ...value, website: event.target.value })}
            />
            {fieldErrors.website ? (
              <span className="block text-xs" role="alert">
                {fieldErrors.website}
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
