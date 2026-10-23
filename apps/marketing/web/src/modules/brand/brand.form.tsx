import { useState } from "react";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceFormPanel
} from "@codexsun/ui/workspace/upsert";
import { brandSchema } from "./brand.schema";
import type { BrandInput, BrandRecord } from "./brand.types";
export function BrandForm({
  record,
  onCancel,
  onSubmit,
  pending,
  error
}: {
  record: BrandRecord | null;
  onCancel: () => void;
  onSubmit: (input: BrandInput) => void;
  pending: boolean;
  error: string;
}) {
  const [value, setValue] = useState<BrandInput>({
    name: record?.name ?? "",
    timezone: record?.timezone ?? "Asia/Kolkata",
    website: record?.website ?? "",
    status: record?.status ?? "active"
  });
  const [issues, setIssues] = useState<Record<string, string>>({});

  const close = () => {
    if (pending) return;
    if (
      JSON.stringify(value) !==
        JSON.stringify({
          name: record?.name ?? "",
          timezone: record?.timezone ?? "Asia/Kolkata",
          website: record?.website ?? "",
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
          const result = brandSchema.safeParse(value);
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
          <WorkspaceFormField label="Timezone" required={true}>
            <Input
              aria-label="Timezone"
              value={value.timezone}
              aria-invalid={Boolean(issues.timezone)}
              className={issues.timezone ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, timezone: event.target.value })}
            />
            {issues.timezone ? <p className="text-xs text-destructive">{issues.timezone}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Website" required={false}>
            <Input
              aria-label="Website"
              value={value.website}
              aria-invalid={Boolean(issues.website)}
              className={issues.website ? "border-destructive" : ""}
              onChange={(event) => setValue({ ...value, website: event.target.value })}
            />
            {issues.website ? <p className="text-xs text-destructive">{issues.website}</p> : null}
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
