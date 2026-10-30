import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceLookup, WorkspaceSelect } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { Credential, CredentialInput } from "./credential.types";
import { credentialSchema } from "./credential.schema";
export function CredentialForm({
  record,
  companies,
  onSave,
  onCancel
}: {
  record: Credential | null;
  companies: { uuid: string; name: string }[];
  onSave: (value: CredentialInput, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<CredentialInput>(
    record
      ? {
          companyUuid: record.companyUuid,
          kind: record.kind,
          standardName: record.standardName,
          issuer: record.issuer,
          reference: record.reference,
          scope: record.scope,
          publicEvidenceUrl: record.publicEvidenceUrl,
          expiresOn: record.expiresOn,
          privateNotes: record.privateNotes,
          status: record.status,
          reviewConfirmed: false
        }
      : {
          companyUuid: "",
          kind: "certification",
          standardName: "",
          issuer: "",
          reference: "",
          scope: "",
          publicEvidenceUrl: "",
          expiresOn: "",
          privateNotes: "",
          status: "pending",
          reviewConfirmed: false
        }
  );
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = credentialSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      setError("Check the highlighted credential fields.");
      return;
    }
    setErrors({});
    setError("");
    setBusy(true);
    try {
      await onSave(parsed.data, record?.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Credential could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title={record ? "Review credential" : "New credential review"}>
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <WorkspaceFormBanner title="Credential review">{error}</WorkspaceFormBanner>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Only approved, unexpired evidence appears publicly. Confirm issuer, scope and company
          identity independently. Approval is a staff review, not a guarantee of commercial
          performance.
        </p>
        <label className="block space-y-1 text-sm">
          Company *
          <WorkspaceLookup
            value={value.companyUuid}
            onValueChange={(companyUuid) => setValue({ ...value, companyUuid })}
            options={companies.map((company) => ({ value: company.uuid, label: company.name }))}
            placeholder="Select company"
          />
          {errors.companyUuid ? <small className="text-red-600">{errors.companyUuid}</small> : null}
        </label>
        <label className="block space-y-1 text-sm">
          Review type *
          <WorkspaceSelect
            value={value.kind}
            onValueChange={(kind) => setValue({ ...value, kind: kind as CredentialInput["kind"] })}
            options={[
              { value: "certification", label: "Certification evidence" },
              { value: "identity", label: "Business identity review" }
            ]}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["standardName", "Standard / identity check"],
              ["issuer", "Issuer / authoritative source"],
              ["reference", "Certificate / registry reference"],
              ["publicEvidenceUrl", "Public evidence URL"],
              ["expiresOn", "Review valid until"]
            ] as const
          ).map(([key, label]) => (
            <label className="block space-y-1 text-sm" key={key}>
              {label} *
              <Input
                name={key}
                type={key === "expiresOn" ? "date" : key === "publicEvidenceUrl" ? "url" : "text"}
                value={value[key]}
                onChange={(event) => setValue({ ...value, [key]: event.target.value })}
                aria-invalid={!!errors[key]}
                className={errors[key] ? "border-red-500" : ""}
              />
              {errors[key] ? <small className="text-red-600">{errors[key]}</small> : null}
            </label>
          ))}
        </div>
        <label className="block space-y-1 text-sm">
          Public scope of review *
          <Textarea
            name="scope"
            value={value.scope}
            onChange={(event) => setValue({ ...value, scope: event.target.value })}
            aria-invalid={!!errors.scope}
            className={errors.scope ? "border-red-500" : ""}
          />
          {errors.scope ? <small className="text-red-600">{errors.scope}</small> : null}
        </label>
        <label className="block space-y-1 text-sm">
          Private staff notes
          <Textarea
            name="privateNotes"
            value={value.privateNotes}
            onChange={(event) => setValue({ ...value, privateNotes: event.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          Review outcome *
          <WorkspaceSelect
            value={value.status}
            onValueChange={(status) =>
              setValue({
                ...value,
                status: status as CredentialInput["status"],
                reviewConfirmed: false
              })
            }
            options={["pending", "approved", "rejected", "revoked"].map((status) => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1)
            }))}
          />
        </label>
        {value.status === "approved" ? (
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.reviewConfirmed}
              onChange={(event) => setValue({ ...value, reviewConfirmed: event.target.checked })}
            />
            I checked the public evidence, company, issuer, scope and validity before approving.
          </label>
        ) : null}
        {errors.reviewConfirmed ? (
          <p className="text-sm text-red-600">{errors.reviewConfirmed}</p>
        ) : null}
        <div className="flex gap-2">
          <Button disabled={busy}>{busy ? "Saving…" : "Save review"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
