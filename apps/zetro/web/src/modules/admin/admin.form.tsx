import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import type { ZetroGrantChange, ZetroPatternDraft, ZetroRole } from "./admin.types";
import { zetroCapabilities, zetroCapabilityLabels } from "./admin.types";

export function ZetroPatternDraftForm({
  draft,
  setDraft,
  pending,
  onSubmit
}: {
  draft: ZetroPatternDraft;
  setDraft: Dispatch<SetStateAction<ZetroPatternDraft>>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Add a draft pattern</h2>
      <p className="text-sm text-muted-foreground">
        A draft is review data. A new live query needs a backend contract and approval.
      </p>
      <div className="grid gap-3 md:grid-cols-[8rem_1fr_1fr]">
        <Input
          aria-label="Serial number"
          type="number"
          min={36}
          value={draft.serialNo}
          onChange={(event) =>
            setDraft((value) => ({ ...value, serialNo: Number(event.target.value) }))
          }
          required
        />
        <Input
          aria-label="Question pattern"
          placeholder="Question pattern"
          value={draft.questionPattern}
          onChange={(event) =>
            setDraft((value) => ({ ...value, questionPattern: event.target.value }))
          }
          required
        />
        <Input
          aria-label="Query pattern key"
          placeholder="Named backend contract key"
          value={draft.queryPattern}
          onChange={(event) =>
            setDraft((value) => ({ ...value, queryPattern: event.target.value }))
          }
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          aria-label="Limitation"
          placeholder="Limitation"
          value={draft.limitation}
          onChange={(event) => setDraft((value) => ({ ...value, limitation: event.target.value }))}
          required
        />
        <Textarea
          aria-label="Extra notes"
          placeholder="Extra notes"
          value={draft.extra}
          onChange={(event) => setDraft((value) => ({ ...value, extra: event.target.value }))}
          maxLength={2000}
        />
      </div>
      <Button type="submit" disabled={pending}>
        Save draft
      </Button>
    </form>
  );
}

export function ZetroGrantForm({
  change,
  setChange,
  roles,
  pending,
  onSubmit
}: {
  change: ZetroGrantChange;
  setChange: Dispatch<SetStateAction<ZetroGrantChange>>;
  roles: ZetroRole[] | undefined;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-4 grid gap-3 md:grid-cols-[10rem_1fr_8rem_1fr_auto]" onSubmit={onSubmit}>
      <select
        aria-label="Tenant role key"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={change.roleKey}
        required
        onChange={(event) => setChange((value) => ({ ...value, roleKey: event.target.value }))}
      >
        <option value="">Select role</option>
        {roles?.map((role) => (
          <option key={role.role_key} value={role.role_key}>
            {role.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Business read"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={change.capabilityKey}
        onChange={(event) =>
          setChange((value) => ({
            ...value,
            capabilityKey: event.target.value as ZetroGrantChange["capabilityKey"]
          }))
        }
      >
        {zetroCapabilities.map((capability) => (
          <option key={capability} value={capability}>
            {zetroCapabilityLabels[capability]}
          </option>
        ))}
      </select>
      <select
        aria-label="Grant status"
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={change.status}
        onChange={(event) =>
          setChange((value) => ({
            ...value,
            status: event.target.value as ZetroGrantChange["status"]
          }))
        }
      >
        <option value="active">Allow</option>
        <option value="revoked">Revoke</option>
      </select>
      <Input
        aria-label="Reason for access decision"
        placeholder="Reason"
        value={change.reason}
        maxLength={500}
        required
        onChange={(event) => setChange((value) => ({ ...value, reason: event.target.value }))}
      />
      <Button disabled={pending} type="submit">
        Save
      </Button>
    </form>
  );
}
