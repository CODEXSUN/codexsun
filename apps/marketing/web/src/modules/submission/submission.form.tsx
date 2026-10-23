import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@codexsun/ui/components/input";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormFooter,
  WorkspaceFormPanel
} from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import { captureOptions } from "./submission.services";
import { submissionSchema } from "./submission.schema";
import type { SubmissionInput } from "./submission.types";
export function SubmissionForm({
  onSubmit,
  onClose,
  pending,
  error
}: {
  onSubmit: (value: SubmissionInput) => void;
  onClose: () => void;
  pending: boolean;
  error: string;
}) {
  const api = useMarketingTransport();
  const forms = useQuery({
    queryKey: ["marketing", api.scopeKey, "capture-options"],
    queryFn: () => captureOptions(api)
  });
  const [value, setValue] = useState({
    captureUuid: "",
    sourceKey: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
    message: "",
    privacyConsent: false
  });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const close = () => {
    if (pending) return;
    if (
      (value.name || value.email || value.phone || value.message || value.captureUuid) &&
      !window.confirm("Discard unsaved submission?")
    )
      return;
    onClose();
  };
  const form = forms.data?.find((row) => row.uuid === value.captureUuid);
  return (
    <WorkspaceFormPanel
      title="New submission"
      description="Capture a prospect with source consent evidence."
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const result = submissionSchema.safeParse(value);
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
        {error || forms.error || Object.keys(issues).length ? (
          <WorkspaceFormBanner tone="error" title="Unable to save">
            {error || forms.error?.message || "Check the required fields and consent."}
          </WorkspaceFormBanner>
        ) : null}
        <WorkspaceFormGrid>
          <WorkspaceFormField label="Capture form" required>
            <WorkspaceLookup
              ariaLabel="Capture form"
              allowTextValue={false}
              value={value.captureUuid}
              options={(forms.data ?? [])
                .filter((row) => row.status === "active")
                .map((row) => ({ value: row.uuid, label: row.name }))}
              onValueChange={(captureUuid) =>
                setValue({ ...value, captureUuid, privacyConsent: false })
              }
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Name" required={true}>
            <Input
              aria-label="name"
              value={value.name}
              aria-invalid={Boolean(issues.name)}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
            />
            {issues.name ? <p className="text-destructive text-xs">{issues.name}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Email" required={false}>
            <Input
              aria-label="email"
              value={value.email}
              aria-invalid={Boolean(issues.email)}
              onChange={(event) => setValue({ ...value, email: event.target.value })}
            />
            {issues.email ? <p className="text-destructive text-xs">{issues.email}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Phone" required={false}>
            <Input
              aria-label="phone"
              value={value.phone}
              aria-invalid={Boolean(issues.phone)}
              onChange={(event) => setValue({ ...value, phone: event.target.value })}
            />
            {issues.phone ? <p className="text-destructive text-xs">{issues.phone}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Message" required={false}>
            <Input
              aria-label="message"
              value={value.message}
              aria-invalid={Boolean(issues.message)}
              onChange={(event) => setValue({ ...value, message: event.target.value })}
            />
            {issues.message ? <p className="text-destructive text-xs">{issues.message}</p> : null}
          </WorkspaceFormField>
        </WorkspaceFormGrid>
        <div className="space-y-2 px-4 py-3">
          <p className="text-sm">{form?.consentNotice}</p>
          <label className="flex gap-2 text-sm">
            <Checkbox
              checked={value.privacyConsent}
              onCheckedChange={(checked) =>
                setValue({ ...value, privacyConsent: checked === true })
              }
            />
            I confirm privacy consent was captured using this form notice.
          </label>
          <p className="text-xs text-muted-foreground">
            This does not subscribe the prospect to marketing messages.
          </p>
        </div>
        <WorkspaceFormFooter
          onCancel={close}
          primaryLabel="Save submission"
          primaryLoading={pending}
        />
      </form>
    </WorkspaceFormPanel>
  );
}
