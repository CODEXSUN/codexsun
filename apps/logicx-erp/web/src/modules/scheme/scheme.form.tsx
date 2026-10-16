import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import { useLogicxErpSchemeInvoices, useLogicxErpSchemeLookups } from "./scheme.hooks";
import { parseLogicxErpSchemeDraft } from "./scheme.schema";
import {
  formatSchemeAmount,
  formatSchemeDate,
  type LogicxErpSchemeGateway
} from "./scheme.services";
import type {
  LogicxErpSchemeDraft,
  LogicxErpSchemeRecord,
  LogicxErpSchemeSavePayload
} from "./scheme.types";

const priorityOptions = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" }
];

export function LogicxErpSchemeForm({
  error,
  gateway,
  loading,
  onBack,
  onSubmit,
  scheme
}: {
  error: string;
  gateway: LogicxErpSchemeGateway;
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: LogicxErpSchemeSavePayload) => void;
  scheme: LogicxErpSchemeRecord | null;
}) {
  const [draft, setDraft] = useState<LogicxErpSchemeDraft>(() => toDraft(scheme));
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const lookupsQuery = useLogicxErpSchemeLookups(gateway);
  const invoicesQuery = useLogicxErpSchemeInvoices(gateway, invoiceSearch);

  const set = <Key extends keyof LogicxErpSchemeDraft>(
    key: Key,
    next: LogicxErpSchemeDraft[Key]
  ) => {
    setDraft((current) => ({ ...current, [key]: next }));
    setIssues((current) => ({ ...current, [key]: "" }));
  };

  const invoiceOptions = useMemo(() => {
    const options = (invoicesQuery.data ?? []).map((invoice) => ({
      value: invoice.id,
      label: invoice.invoiceNumber,
      description: `${invoice.customerName} · ${formatSchemeDate(invoice.issuedOn)}`,
      meta: formatSchemeAmount(invoice.amount)
    }));
    return draft.salesId && !options.some((option) => option.value === draft.salesId)
      ? [{ value: draft.salesId, label: draft.invoiceNumber }, ...options]
      : options;
  }, [draft.invoiceNumber, draft.salesId, invoicesQuery.data]);
  const brandOptions = (lookupsQuery.data?.brands ?? []).map((brand) => ({
    value: String(brand.id),
    label: brand.name
  }));
  const userOptions = (lookupsQuery.data?.users ?? []).map((user) => ({
    value: String(user.id),
    label: user.name,
    description: user.email
  }));
  // Keep a saved reference visible even if that parent is no longer active.
  const withCurrent = (
    options: Array<{ value: string; label: string; description?: string }>,
    value: string,
    label: string | null | undefined
  ) =>
    value && label && !options.some((option) => option.value === value)
      ? [{ value, label }, ...options]
      : options;

  const submit = () => {
    const parsed = parseLogicxErpSchemeDraft(draft);
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
  };

  const shownError =
    Object.values(issues).find(Boolean) ||
    error ||
    (lookupsQuery.error instanceof Error ? lookupsQuery.error.message : "");

  return (
    <WorkspaceUpsertPage
      className="max-w-5xl"
      description="Scheme operated by a vendor against a sales invoice."
      onBack={onBack}
      title={scheme ? `Edit ${scheme.schemeNo}` : "New scheme"}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {shownError ? (
              <WorkspaceFormBanner title="Unable to save scheme">{shownError}</WorkspaceFormBanner>
            ) : null}
            <FormSection title="Scheme details">
              <WorkspaceFormField label="Scheme date" required>
                <WorkspaceDatePicker
                  ariaLabel="Scheme date"
                  onValueChange={(value) => set("schemeDate", value)}
                  required
                  value={draft.schemeDate}
                />
                <FieldError message={issues.schemeDate} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Sales invoice" required>
                <WorkspaceLookup
                  allowTextValue={false}
                  emptyLabel={
                    invoicesQuery.isFetching ? "Searching..." : "No sales invoices found."
                  }
                  invalid={Boolean(issues.salesId)}
                  loading={invoicesQuery.isFetching}
                  onTextChange={setInvoiceSearch}
                  onValueChange={(value, option) => {
                    setDraft((current) => ({
                      ...current,
                      invoiceNumber: option?.label ?? "",
                      salesId: value
                    }));
                    setIssues((current) => ({ ...current, salesId: "" }));
                  }}
                  options={invoiceOptions}
                  placeholder="Search invoice or customer"
                  required
                  showAllOptionsOnFocus
                  value={draft.salesId}
                />
                <FieldError message={issues.salesId} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Priority" required>
                <WorkspaceSelect
                  ariaLabel="Priority"
                  onValueChange={(value) =>
                    set("priority", value as LogicxErpSchemeDraft["priority"])
                  }
                  options={priorityOptions}
                  placeholder="Select priority"
                  required
                  value={draft.priority}
                />
                <FieldError message={issues.priority} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Support value" required>
                <Input
                  aria-invalid={Boolean(issues.supportValue)}
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => set("supportValue", event.target.value)}
                  step={1}
                  type="number"
                  value={draft.supportValue}
                />
                <FieldError message={issues.supportValue} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Brand" required>
                <WorkspaceLookup
                  allowTextValue={false}
                  invalid={Boolean(issues.brandId)}
                  loading={lookupsQuery.isLoading}
                  onValueChange={(value) => set("brandId", value)}
                  options={withCurrent(brandOptions, draft.brandId, scheme?.brandName)}
                  placeholder="Choose brand"
                  required
                  showAllOptionsOnFocus
                  value={draft.brandId}
                />
                <FieldError message={issues.brandId} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Requested by" required>
                <WorkspaceLookup
                  allowTextValue={false}
                  invalid={Boolean(issues.requestedByUserId)}
                  loading={lookupsQuery.isLoading}
                  onValueChange={(value) => set("requestedByUserId", value)}
                  options={withCurrent(
                    userOptions,
                    draft.requestedByUserId,
                    scheme?.requestedByName
                  )}
                  placeholder="Choose user"
                  required
                  showAllOptionsOnFocus
                  value={draft.requestedByUserId}
                />
                <FieldError message={issues.requestedByUserId} />
              </WorkspaceFormField>
              <WorkspaceFormField className="md:col-span-2" label="Scheme description" required>
                <Input
                  aria-invalid={Boolean(issues.description)}
                  maxLength={255}
                  onChange={(event) => set("description", event.target.value)}
                  value={draft.description}
                />
                <FieldError message={issues.description} />
              </WorkspaceFormField>
            </FormSection>
            <FormSection title="Approval and claim">
              <WorkspaceFormField label="Approved by">
                <WorkspaceLookup
                  allowTextValue={false}
                  loading={lookupsQuery.isLoading}
                  onValueChange={(value) => set("approvedByUserId", value)}
                  options={withCurrent(userOptions, draft.approvedByUserId, scheme?.approvedByName)}
                  placeholder="Not approved yet"
                  showAllOptionsOnFocus
                  value={draft.approvedByUserId}
                />
              </WorkspaceFormField>
              <WorkspaceFormField label="Amount realized">
                <Input
                  aria-invalid={Boolean(issues.amountRealized)}
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => set("amountRealized", event.target.value)}
                  step={1}
                  type="number"
                  value={draft.amountRealized}
                />
                <FieldError message={issues.amountRealized} />
              </WorkspaceFormField>
              <WorkspaceSwitchCard
                activeLabel="Claim done"
                ariaLabel="Claim done"
                checked={draft.claimDone}
                fieldLabel="Claim"
                inactiveLabel="Claim pending"
                onCheckedChange={(checked) => set("claimDone", checked)}
              />
              <WorkspaceSwitchCard
                ariaLabel="Status"
                checked={draft.status === "active"}
                fieldLabel="Status"
                onCheckedChange={(checked) => set("status", checked ? "active" : "inactive")}
              />
            </FormSection>
          </WorkspaceFormBody>
          <WorkspaceFormActions>
            <Button disabled={loading} type="submit">
              {loading ? "Saving..." : scheme ? "Update" : "Save"}
            </Button>
            <Button disabled={loading} onClick={onBack} type="button" variant="outline">
              Cancel
            </Button>
          </WorkspaceFormActions>
        </WorkspaceFormSurface>
      </form>
    </WorkspaceUpsertPage>
  );
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="space-y-4 border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <WorkspaceFormGrid>{children}</WorkspaceFormGrid>
    </section>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function toDraft(scheme: LogicxErpSchemeRecord | null): LogicxErpSchemeDraft {
  if (!scheme) {
    return {
      schemeDate: new Date().toLocaleDateString("en-CA"),
      salesId: "",
      invoiceNumber: "",
      priority: "",
      supportValue: "",
      brandId: "",
      description: "",
      requestedByUserId: "",
      approvedByUserId: "",
      claimDone: false,
      amountRealized: "",
      status: "active"
    };
  }
  return {
    schemeDate: scheme.schemeDate,
    salesId: scheme.salesId,
    invoiceNumber: scheme.invoiceNumber,
    priority: scheme.priority,
    supportValue: String(scheme.supportValue),
    brandId: String(scheme.brandId),
    description: scheme.description,
    requestedByUserId: String(scheme.requestedByUserId),
    approvedByUserId: scheme.approvedByUserId ? String(scheme.approvedByUserId) : "",
    claimDone: scheme.claimDone,
    amountRealized: scheme.amountRealized === null ? "" : String(scheme.amountRealized),
    status: scheme.status
  };
}
