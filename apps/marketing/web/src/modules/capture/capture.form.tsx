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
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceFormPanel
} from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import { captureSchema } from "./capture.schema";
import type { CaptureInput, CaptureRecord } from "./capture.types";
export function CaptureForm({
  record,
  onCancel,
  onSubmit,
  pending,
  error
}: {
  record: CaptureRecord | null;
  onCancel: () => void;
  onSubmit: (input: CaptureInput) => void;
  pending: boolean;
  error: string;
}) {
  const api = useMarketingTransport();
  const [value, setValue] = useState<CaptureInput>({
    brandUuid: record?.brandUuid ?? "",
    campaignUuid: record?.campaignUuid ?? "",
    name: record?.name ?? "",
    allowedOrigin: record?.allowedOrigin ?? "",
    consentNotice: record?.consentNotice ?? "",
    noticeVersion: record?.noticeVersion ?? "",
    status: record?.status ?? "active"
  });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const brands = useQuery({
    queryKey: ["marketing", api.scopeKey, "brand-options"],
    queryFn: () => api.get<{ uuid: string; name: string }[]>("/marketing/brands?limit=100")
  });
  const campaigns = useQuery({
    queryKey: ["marketing", api.scopeKey, "campaign-options"],
    queryFn: () => api.get<{ uuid: string; name: string }[]>("/marketing/campaigns?limit=100")
  });
  const close = () => {
    if (pending) return;
    if (
      JSON.stringify(value) !==
        JSON.stringify({
          brandUuid: record?.brandUuid ?? "",
          campaignUuid: record?.campaignUuid ?? "",
          name: record?.name ?? "",
          allowedOrigin: record?.allowedOrigin ?? "",
          consentNotice: record?.consentNotice ?? "",
          noticeVersion: record?.noticeVersion ?? "",
          status: record?.status ?? "active"
        }) &&
      !window.confirm("Discard unsaved changes?")
    )
      return;
    onCancel();
  };
  return (
    <WorkspaceFormPanel title="" description="Marketing details for the current company.">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const result = captureSchema.safeParse(value);
          if (!result.success) {
            setIssues(
              Object.fromEntries(
                result.error.issues.map((issue) => [String(issue.path[0]), issue.message])
              )
            );
            return;
          }
          setIssues({});
          onSubmit(result.data);
        }}
      >
        {error || Object.keys(issues).length ? (
          <WorkspaceFormBanner title="Unable to save" tone="error">
            {error || "Check the required fields."}
          </WorkspaceFormBanner>
        ) : null}
        <WorkspaceFormGrid>
          <WorkspaceFormField label="Brand" required>
            <WorkspaceLookup
              ariaLabel="Brand"
              allowTextValue={false}
              invalid={Boolean(issues.brandUuid)}
              value={value.brandUuid}
              options={(brands.data ?? []).map((row) => ({ value: row.uuid, label: row.name }))}
              onValueChange={(next) => setValue({ ...value, brandUuid: next })}
            />
            {issues.brandUuid ? (
              <p className="text-xs text-destructive">{issues.brandUuid}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Campaign" required>
            <WorkspaceLookup
              ariaLabel="Campaign"
              allowTextValue={false}
              invalid={Boolean(issues.campaignUuid)}
              value={value.campaignUuid}
              options={(campaigns.data ?? []).map((row) => ({ value: row.uuid, label: row.name }))}
              onValueChange={(next) => setValue({ ...value, campaignUuid: next })}
            />
            {issues.campaignUuid ? (
              <p className="text-xs text-destructive">{issues.campaignUuid}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Name" required={true}>
            <Input
              aria-label="Name"
              value={value.name}
              aria-invalid={Boolean(issues.name)}
              className={issues.name ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
            />
            {issues.name ? <p className="text-xs text-destructive">{issues.name}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Allowed Origin" required={true}>
            <Input
              aria-label="Allowed Origin"
              value={value.allowedOrigin}
              aria-invalid={Boolean(issues.allowedOrigin)}
              className={issues.allowedOrigin ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, allowedOrigin: event.target.value })}
            />
            {issues.allowedOrigin ? (
              <p className="text-xs text-destructive">{issues.allowedOrigin}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Consent Notice" required={true}>
            <Input
              aria-label="Consent Notice"
              value={value.consentNotice}
              aria-invalid={Boolean(issues.consentNotice)}
              className={issues.consentNotice ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, consentNotice: event.target.value })}
            />
            {issues.consentNotice ? (
              <p className="text-xs text-destructive">{issues.consentNotice}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Notice Version" required={true}>
            <Input
              aria-label="Notice Version"
              value={value.noticeVersion}
              aria-invalid={Boolean(issues.noticeVersion)}
              className={issues.noticeVersion ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, noticeVersion: event.target.value })}
            />
            {issues.noticeVersion ? (
              <p className="text-xs text-destructive">{issues.noticeVersion}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Status">
            <Select
              value={value.status}
              onValueChange={(next) =>
                setValue({ ...value, status: next === "active" ? "active" : "inactive" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </WorkspaceFormField>
        </WorkspaceFormGrid>
        <WorkspaceFormFooter
          onCancel={close}
          primaryLabel={record ? "Update" : "Save"}
          primaryLoading={pending}
        />
      </form>
    </WorkspaceFormPanel>
  );
}
