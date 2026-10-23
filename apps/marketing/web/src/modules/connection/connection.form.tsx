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
import { connectionSchema } from "./connection.schema";
import type { ConnectionInput, ConnectionRecord } from "./connection.types";
export function ConnectionForm({
  record,
  onCancel,
  onSubmit,
  pending,
  error
}: {
  record: ConnectionRecord | null;
  onCancel: () => void;
  onSubmit: (input: ConnectionInput) => void;
  pending: boolean;
  error: string;
}) {
  const api = useMarketingTransport();
  const [value, setValue] = useState<ConnectionInput>({
    brandUuid: record?.brandUuid ?? "",
    name: record?.name ?? "",
    provider: record?.provider ?? "facebook",
    externalAccountId: record?.externalAccountId ?? "",
    status: record?.status ?? "active"
  });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const brands = useQuery({
    queryKey: ["marketing", api.scopeKey, "brand-options"],
    queryFn: () => api.get<{ uuid: string; name: string }[]>("/marketing/brands?limit=100")
  });

  const close = () => {
    if (pending) return;
    if (
      JSON.stringify(value) !==
        JSON.stringify({
          brandUuid: record?.brandUuid ?? "",
          name: record?.name ?? "",
          provider: record?.provider ?? "facebook",
          externalAccountId: record?.externalAccountId ?? "",
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
          const result = connectionSchema.safeParse(value);
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
          <WorkspaceFormField label="Provider" required>
            <Select
              value={value.provider}
              onValueChange={(next) => setValue({ ...value, provider: next })}
            >
              <SelectTrigger aria-label="Provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">facebook</SelectItem>
                <SelectItem value="instagram">instagram</SelectItem>
                <SelectItem value="whatsapp">whatsapp</SelectItem>
                <SelectItem value="linkedin">linkedin</SelectItem>
                <SelectItem value="google">google</SelectItem>
                <SelectItem value="threads">threads</SelectItem>
                <SelectItem value="pinterest">pinterest</SelectItem>
                <SelectItem value="x">x</SelectItem>
                <SelectItem value="telegram">telegram</SelectItem>
                <SelectItem value="email">email</SelectItem>
              </SelectContent>
            </Select>
          </WorkspaceFormField>
          <WorkspaceFormField label="External Account Id" required={false}>
            <Input
              aria-label="External Account Id"
              value={value.externalAccountId}
              aria-invalid={Boolean(issues.externalAccountId)}
              className={issues.externalAccountId ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, externalAccountId: event.target.value })}
            />
            {issues.externalAccountId ? (
              <p className="text-xs text-destructive">{issues.externalAccountId}</p>
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
