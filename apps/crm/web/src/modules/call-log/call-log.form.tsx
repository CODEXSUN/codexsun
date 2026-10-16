import { useState } from "react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { useCallLogUsers } from "./call-log.hooks";
import { callLogSchema } from "./call-log.schema";
import type { CallLogInput } from "./call-log.types";

const initial: CallLogInput = {
  type: "Incoming",
  from: "",
  to: "",
  status: "Initiated",
  duration: 0,
  user: null
};

export function CallLogForm({
  open,
  loading,
  error,
  types,
  statuses,
  onCancel,
  onSubmit
}: {
  open: boolean;
  loading: boolean;
  error: string;
  types: string[];
  statuses: string[];
  onCancel: () => void;
  onSubmit: (value: CallLogInput) => void;
}) {
  return (
    <WorkspaceUpsertDialog
      open={open}
      onClose={onCancel}
      title="Log a Call"
      description="Record a call in this CRM."
    >
      <CallLogFields
        key={String(open)}
        loading={loading}
        error={error}
        types={types}
        statuses={statuses}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </WorkspaceUpsertDialog>
  );
}

function CallLogFields({
  loading,
  error,
  types,
  statuses,
  onCancel,
  onSubmit
}: {
  loading: boolean;
  error: string;
  types: string[];
  statuses: string[];
  onCancel: () => void;
  onSubmit: (value: CallLogInput) => void;
}) {
  const [value, setValue] = useState<CallLogInput>(initial);
  const [issue, setIssue] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const users = useCallLogUsers(userSearch, true);
  const set = <K extends keyof CallLogInput>(key: K, next: CallLogInput[K]) =>
    setValue((current) => ({ ...current, [key]: next }));
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = callLogSchema.safeParse(value);
        if (!parsed.success) {
          setIssue(parsed.error.issues[0]?.message ?? "Check the call details.");
          return;
        }
        setIssue("");
        onSubmit(parsed.data);
      }}
    >
      {issue || error ? (
        <WorkspaceFormBanner title="Unable to log call">{issue || error}</WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormGrid columns={2}>
        <WorkspaceFormField label="Type" required>
          <WorkspaceSelect
            value={value.type}
            options={types.map((type) => ({ value: type, label: type }))}
            onValueChange={(type) => {
              set("type", type as CallLogInput["type"]);
              set("user", null);
            }}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="To" required>
          <Input
            value={value.to}
            onChange={(event) => set("to", event.target.value)}
            aria-invalid={Boolean(issue && !value.to.trim())}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="From" required>
          <Input
            autoFocus
            value={value.from}
            onChange={(event) => set("from", event.target.value)}
            aria-invalid={Boolean(issue && !value.from.trim())}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Status" required>
          <WorkspaceSelect
            value={value.status}
            options={statuses.map((status) => ({ value: status, label: status }))}
            onValueChange={(status) => set("status", status)}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Duration">
          <Input
            type="number"
            min={0}
            value={value.duration}
            onChange={(event) => set("duration", Number(event.target.value))}
          />
          <p className="text-xs text-muted-foreground">Call duration in seconds</p>
        </WorkspaceFormField>
        <WorkspaceFormField label={value.type === "Incoming" ? "Call Received By" : "Caller"}>
          <WorkspaceLookup
            allowTextValue={false}
            clearable
            options={users.data ?? []}
            loading={users.isLoading}
            placeholder="Choose user"
            value={value.user ?? ""}
            onTextChange={setUserSearch}
            onValueChange={(selected) => set("user", selected || null)}
          />
          {users.error ? <p className="text-xs text-destructive">{users.error.message}</p> : null}
        </WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel="Create"
        primaryLoading={loading}
      />
    </form>
  );
}
