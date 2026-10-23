import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceFormPanel,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormFooter,
  WorkspaceFormBanner
} from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import { consentBrandOptions } from "./consent.services";
import { consentSchema } from "./consent.schema";
import type { ConsentInput } from "./consent.types";
export function ConsentForm({
  pending,
  error,
  onSubmit,
  onCancel
}: {
  pending: boolean;
  error: string;
  onSubmit: (value: ConsentInput) => void;
  onCancel: () => void;
}) {
  const api = useMarketingTransport();
  const brands = useQuery({
    queryKey: ["marketing", api.scopeKey, "consent-brand-options"],
    queryFn: () => consentBrandOptions(api)
  });
  const [initial] = useState<ConsentInput>(() => ({
    brandUuid: "",
    recipient: "",
    channel: "email",
    purpose: "promotional",
    action: "grant",
    noticeVersion: "",
    evidence: "",
    source: "",
    occurredAt: new Date().toISOString(),
    expiresAt: null,
    requestKey: crypto.randomUUID()
  }));
  const [value, setValue] = useState(initial),
    [issues, setIssues] = useState<Record<string, string>>({});
  const close = () => {
    if (pending) return;
    if (
      JSON.stringify(initial) !== JSON.stringify(value) &&
      !window.confirm("Discard unsaved evidence?")
    )
      return;
    onCancel();
  };
  const fieldError = (key: string) =>
    issues[key] ? <p className="text-xs text-destructive">{issues[key]}</p> : null;
  return (
    <WorkspaceFormPanel
      title="Consent evidence"
      description="Record explicit promotional email evidence. Enquiry privacy consent does not grant promotional permission."
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = consentSchema.safeParse(value);
          if (!parsed.success) {
            setIssues(
              Object.fromEntries(
                parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
              )
            );
            return;
          }
          setIssues({});
          onSubmit(parsed.data);
        }}
      >
        {error || Object.keys(issues).length ? (
          <WorkspaceFormBanner title="Unable to save" tone="error">
            {error || "Check the required fields."}
          </WorkspaceFormBanner>
        ) : null}
        {brands.error ? <p role="alert">{brands.error.message}</p> : null}
        <WorkspaceFormGrid>
          <WorkspaceFormField label="Brand" required>
            <WorkspaceLookup
              ariaLabel="Brand"
              value={value.brandUuid}
              options={(brands.data ?? []).map((row) => ({ value: row.uuid, label: row.name }))}
              allowTextValue={false}
              invalid={!!issues.brandUuid}
              onValueChange={(brandUuid) =>
                setValue({ ...value, brandUuid: String(brandUuid ?? "") })
              }
            />
            {fieldError("brandUuid")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Recipient email" required>
            <Input
              aria-label="Recipient email"
              value={value.recipient}
              aria-invalid={!!issues.recipient}
              onChange={(event) => setValue({ ...value, recipient: event.target.value })}
            />
            {fieldError("recipient")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Action" required>
            <Select
              value={value.action}
              onValueChange={(action) =>
                setValue({ ...value, action: action === "withdraw" ? "withdraw" : "grant" })
              }
            >
              <SelectTrigger aria-label="Action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grant">Record grant</SelectItem>
                <SelectItem value="withdraw">Record withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </WorkspaceFormField>
          <WorkspaceFormField label="Notice version" required>
            <Input
              aria-label="Notice version"
              value={value.noticeVersion}
              aria-invalid={!!issues.noticeVersion}
              onChange={(event) => setValue({ ...value, noticeVersion: event.target.value })}
            />
            {fieldError("noticeVersion")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Evidence reference" required>
            <Input
              aria-label="Evidence reference"
              value={value.evidence}
              aria-invalid={!!issues.evidence}
              onChange={(event) => setValue({ ...value, evidence: event.target.value })}
            />
            {fieldError("evidence")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Source" required>
            <Input
              aria-label="Source"
              value={value.source}
              aria-invalid={!!issues.source}
              onChange={(event) => setValue({ ...value, source: event.target.value })}
            />
            {fieldError("source")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Evidence time (UTC)" required>
            <Input
              aria-label="Evidence time (UTC)"
              type="datetime-local"
              value={value.occurredAt.slice(0, 16)}
              aria-invalid={!!issues.occurredAt}
              onChange={(event) =>
                setValue({
                  ...value,
                  occurredAt: event.target.value
                    ? new Date(event.target.value + "Z").toISOString()
                    : ""
                })
              }
            />
            {fieldError("occurredAt")}
          </WorkspaceFormField>
          <WorkspaceFormField label="Expires at (UTC, optional)">
            <Input
              aria-label="Expires at (UTC, optional)"
              type="datetime-local"
              value={value.expiresAt?.slice(0, 16) ?? ""}
              aria-invalid={!!issues.expiresAt}
              onChange={(event) =>
                setValue({
                  ...value,
                  expiresAt: event.target.value
                    ? new Date(event.target.value + "Z").toISOString()
                    : null
                })
              }
            />
            {fieldError("expiresAt")}
          </WorkspaceFormField>
        </WorkspaceFormGrid>
        <WorkspaceFormFooter
          primaryLabel="Record evidence"
          primaryLoading={pending}
          onCancel={close}
        />
      </form>
    </WorkspaceFormPanel>
  );
}
