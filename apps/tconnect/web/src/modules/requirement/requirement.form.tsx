import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { requirementInput } from "./requirement.schema";
import type { Requirement, RequirementInput } from "./requirement.types";
export function RequirementForm({
  record,
  onSave,
  onCancel
}: {
  record: Requirement | null;
  onSave: (input: RequirementInput, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<RequirementInput["status"]>(record?.status ?? "open");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = requirementInput.safeParse({
      ...Object.fromEntries(form),
      status,
      budget: form.get("budget") === "" ? null : Number(form.get("budget"))
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues.map((issue) => `${issue.path.join(" ")}: ${issue.message}`).join(" ")
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(parsed.data, record?.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save requirement.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title={record ? "Edit requirement" : "Post a requirement"}>
      <form className="space-y-4" onSubmit={submit}>
        {error ? (
          <WorkspaceFormBanner title="Check your requirement">{error}</WorkspaceFormBanner>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Open requirements appear on the seller opportunity board. Drafts are private. Close a
          requirement when sourcing is complete.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            Title *
            <Input
              name="title"
              required
              minLength={5}
              maxLength={180}
              defaultValue={record?.title}
              placeholder="5,000 organic cotton T-shirts"
            />
          </label>
          <label className="space-y-1 text-sm">
            Category *
            <Input
              name="category"
              required
              minLength={2}
              maxLength={100}
              defaultValue={record?.category}
              placeholder="Knitwear / Packaging / Machinery"
            />
          </label>
          <label className="space-y-1 text-sm">
            Quantity *
            <Input
              name="quantity"
              required
              maxLength={100}
              defaultValue={record?.quantity}
              placeholder="5,000 pieces"
            />
          </label>
          <label className="space-y-1 text-sm">
            Delivery city *
            <Input
              name="deliveryCity"
              required
              minLength={2}
              maxLength={100}
              defaultValue={record?.deliveryCity ?? "Tirupur"}
            />
          </label>
          <label className="space-y-1 text-sm">
            Total budget (INR, optional)
            <Input
              name="budget"
              type="number"
              min={0}
              max={1000000000}
              step="0.01"
              defaultValue={record?.budget ?? ""}
            />
          </label>
          <label className="space-y-1 text-sm">
            Visibility
            <WorkspaceSelect
              value={status}
              onValueChange={(value) => setStatus(value as RequirementInput["status"])}
              options={[
                { value: "draft", label: "Draft — only me" },
                { value: "open", label: "Open — visible to sellers" },
                { value: "closed", label: "Closed" }
              ]}
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          Specifications *
          <Textarea
            name="description"
            required
            minLength={20}
            maxLength={4000}
            defaultValue={record?.description}
            placeholder="Materials, sizes, quality, delivery timeline and other sourcing details"
          />
        </label>
        <div className="flex gap-2">
          <Button disabled={busy}>{busy ? "Saving…" : "Save requirement"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
