import { useEffect, useRef, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceDateInputPicker } from "@codexsun/ui/workspace/date-input-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { prioritySwatch, statusIcon } from "../../crm-colors";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import { enquirySchema } from "./enquiry.schema";
import { EnquiryCustomerFields } from "./enquiry.customer-fields";
import { EnquiryMobileContext } from "./enquiry.mobile-context";
import { useEnquiryMasterCreate } from "./enquiry.master-create";
import type {
  EnquiryLookup,
  EnquiryMasterLookup,
  EnquiryRecord,
  EnquirySavePayload
} from "./enquiry.types";

export const newEnquiryFormId = "crm-new-enquiry-form";

const newEnquirySchema = enquirySchema.superRefine((value, context) => {
  if (value.capturedPhone && !/^\d{10}$/.test(value.capturedPhone)) {
    context.addIssue({
      code: "custom",
      message: "Enter a 10-digit mobile number.",
      path: ["capturedPhone"]
    });
  }
});

export function EnquiryForm({
  record,
  contacts,
  contactsLoading,
  listOptions,
  statuses,
  priorities,
  users,
  loading,
  error,
  lookupError,
  onBack,
  onSeeMoreEnquiries,
  onOpenEnquiry,
  onContactSaved,
  onSubmit
}: {
  record: EnquiryRecord | null;
  contacts: EnquiryLookup[];
  contactsLoading: boolean;
  listOptions: EnquiryMasterLookup[];
  statuses: EnquiryMasterLookup[];
  priorities: EnquiryMasterLookup[];
  users: EnquiryLookup[];
  loading: boolean;
  error: string;
  lookupError: string;
  onBack: () => void;
  onSeeMoreEnquiries?: ((mobile: string, contactId: number | null) => void) | undefined;
  onOpenEnquiry?: ((id: string, mobile: string, contactId: number | null) => void) | undefined;
  onContactSaved: () => Promise<void>;
  onSubmit: (payload: EnquirySavePayload) => void;
}) {
  const createMaster = useEnquiryMasterCreate();
  const [value, setValue] = useState<EnquirySavePayload>(() =>
    record ? fromRecord(record) : emptyEnquiry(statuses, priorities)
  );
  const createDefaultsInitialized = useRef(Boolean(record));
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [dueDateInvalid, setDueDateInvalid] = useState(false);
  const escapeNavigation = useRef(false);
  const keyboardLookup = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (record) {
      createDefaultsInitialized.current = false;
      return;
    }
    if (createDefaultsInitialized.current || !statuses.length || !priorities.length) return;
    setValue((current) => ({
      ...current,
      statusId: current.statusId || String(statuses.find((item) => item.code === "new")?.id ?? ""),
      priorityId:
        current.priorityId || String(priorities.find((item) => item.code === "normal")?.id ?? "")
    }));
    createDefaultsInitialized.current = true;
  }, [priorities, record, statuses]);
  useEffect(() => {
    if (record) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.repeat ||
        event.key.toLowerCase() !== "s" ||
        (event.target instanceof Element && event.target.closest('[role="dialog"]'))
      ) {
        return;
      }
      event.preventDefault();
      (document.getElementById(newEnquiryFormId) as HTMLFormElement | null)?.requestSubmit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [record]);
  const set = <Key extends keyof EnquirySavePayload>(key: Key, next: EnquirySavePayload[Key]) => {
    setValue((current) => ({ ...current, [key]: next }));
    setIssues((current) => ({ ...current, [key]: "" }));
  };
  const setCustomer = (
    next: Partial<Pick<EnquirySavePayload, "contactId" | "capturedName" | "capturedPhone">>
  ) => {
    setValue((current) => ({ ...current, ...next }));
    setIssues((current) => ({ ...current, capturedName: "", capturedPhone: "" }));
  };
  const shownError = Object.values(issues).find(Boolean) || error;
  const suggestedTitle = titleFromMessage(value.description);
  const selectedStatus = statuses.find((item) => item.id === value.statusId)?.code ?? "";
  const needsOutcome = ["won", "lost", "closed"].includes(selectedStatus);
  const submit = () => {
    if (loading) return;
    if (dueDateInvalid) {
      setIssues((current) => ({ ...current, dueDate: "Enter a valid date as DD/MM/YYYY." }));
      return;
    }
    if (needsOutcome && !value.closedReason?.trim()) {
      setIssues((current) => ({ ...current, closedReason: "Enter an outcome reason." }));
      return;
    }
    const payload = normalize(value);
    const result = (record ? enquirySchema : newEnquirySchema).safeParse(payload);
    if (!result.success) {
      setIssues(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }
    setIssues({});
    onSubmit(payload);
  };
  return (
    <WorkspaceUpsertPage
      className={
        record
          ? "max-w-5xl"
          : "grid max-w-[92rem] items-start gap-4 space-y-0 pt-0 lg:pt-0 xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_20rem]"
      }
      title={record ? `Edit enquiry #${record.enquiryNo}` : ""}
      {...(record ? { description: record.title } : {})}
      {...(record ? { onBack } : {})}
    >
      <form
        className="min-w-0"
        {...(record ? {} : { id: newEnquiryFormId })}
        noValidate
        onKeyDownCapture={(event) => {
          if (record) return;
          const target = event.target;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            escapeNavigation.current = false;
            keyboardLookup.current =
              target instanceof HTMLElement && target.getAttribute("role") === "combobox"
                ? target
                : null;
            return;
          }
          if (event.key === "Enter") {
            escapeNavigation.current = false;
            if (
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.nativeEvent.isComposing
            ) {
              return;
            }
            if (
              target instanceof HTMLElement &&
              target.getAttribute("role") === "combobox" &&
              target.getAttribute("aria-expanded") === "true" &&
              keyboardLookup.current === target
            ) {
              keyboardLookup.current = null;
              return;
            }
            keyboardLookup.current = null;
            const controls = enquiryNavigationControls(event.currentTarget);
            const index = controls.indexOf(target as HTMLElement);
            if (index < 0) return;
            event.preventDefault();
            event.stopPropagation();
            if (index === controls.length - 1) {
              document
                .querySelector<HTMLButtonElement>(
                  `button[form="${newEnquiryFormId}"][type="submit"]`
                )
                ?.focus();
              return;
            }
            controls[index + 1]?.focus();
            return;
          }
          keyboardLookup.current = null;
          if (event.key !== "Escape") {
            escapeNavigation.current = false;
            return;
          }
          if (!(target instanceof HTMLElement)) return;
          const controls = enquiryNavigationControls(event.currentTarget);
          const index = controls.indexOf(target);
          if (index < 0) return;
          event.preventDefault();
          event.stopPropagation();
          if (
            !escapeNavigation.current &&
            (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
          ) {
            selectFieldText(target);
            escapeNavigation.current = true;
            return;
          }
          if (index === 0) {
            onBack();
            return;
          }
          const previous = controls[index - 1]!;
          previous.focus();
          selectFieldText(previous);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {shownError ? (
              <WorkspaceFormBanner title="Unable to save enquiry">{shownError}</WorkspaceFormBanner>
            ) : null}
            {lookupError ? (
              <WorkspaceFormBanner title="Lookup unavailable" tone="warning">
                {lookupError}
              </WorkspaceFormBanner>
            ) : null}
            <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-8">
              <section
                className="min-w-0 rounded-md border border-border/80 p-4 sm:p-5"
                aria-label="Enquiry content"
              >
                <div className="space-y-5">
                  <EnquiryCustomerFields
                    strictMobile={!record}
                    autoFocusMobile={!record}
                    contacts={contacts}
                    loading={contactsLoading}
                    value={value}
                    error={issues.capturedName ?? ""}
                    mobileError={issues.capturedPhone ?? ""}
                    onChange={setCustomer}
                    onContactSaved={onContactSaved}
                  />
                  <WorkspaceFormField
                    label="Enquiry message"
                    required={!value.title.trim()}
                    className="enquiry-nav-field"
                  >
                    <Textarea
                      className="min-h-52 resize-y"
                      rows={8}
                      value={value.description ?? ""}
                      aria-invalid={Boolean(issues.description)}
                      onChange={(event) => set("description", event.target.value)}
                    />
                    {issues.description ? <FieldError>{issues.description}</FieldError> : null}
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Title" className="enquiry-nav-field">
                    <Input
                      value={value.title}
                      placeholder={suggestedTitle || "Auto-filled from the enquiry message"}
                      aria-invalid={Boolean(issues.title)}
                      onChange={(event) => set("title", event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use the first 100 characters of the enquiry message.
                    </p>
                    {issues.title ? <FieldError>{issues.title}</FieldError> : null}
                  </WorkspaceFormField>
                </div>
              </section>
              <section
                className="min-w-0 rounded-md border border-border/80 p-4 sm:p-5"
                aria-label="Enquiry details"
              >
                <div className="space-y-5">
                  <WorkspaceFormField label="List in" className="enquiry-nav-field">
                    <WorkspaceLookup
                      allowTextValue={false}
                      clearable
                      createMode="inline"
                      createLabel="Create List In"
                      showCreateWhenEmpty
                      showAllOptionsOnFocus
                      options={listOptions
                        .filter((item) => item.status === "active")
                        .map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Choose list"
                      value={value.listInId ? String(value.listInId) : ""}
                      invalid={Boolean(issues.listInId)}
                      onCreate={createMaster.listIn}
                      onTextChange={() => set("listInId", null)}
                      onValueChange={(selected) => set("listInId", selected || null)}
                    />
                    {issues.listInId ? <FieldError>{issues.listInId}</FieldError> : null}
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Assigned to" className="enquiry-nav-field">
                    <WorkspaceLookup
                      allowTextValue={false}
                      options={users
                        .filter((item) => item.status === "active")
                        .map((item) => ({ value: String(item.id), label: item.name }))}
                      placeholder="Unassigned"
                      value={value.assignedUserId ? String(value.assignedUserId) : ""}
                      onValueChange={(selected) => set("assignedUserId", selected || null)}
                    />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Priority" className="enquiry-nav-field">
                    <WorkspaceLookup
                      allowTextValue={false}
                      clearable={false}
                      createMode="inline"
                      createLabel="Create Priority"
                      showCreateWhenEmpty
                      showAllOptionsOnFocus
                      options={priorities
                        .filter((item) => item.status === "active")
                        .map((item) => ({
                          label: item.name,
                          value: String(item.id),
                          swatchClassName: prioritySwatch(item.code ?? "")
                        }))}
                      value={value.priorityId ? String(value.priorityId) : ""}
                      onCreate={createMaster.priority}
                      onTextChange={() => set("priorityId", "")}
                      onValueChange={(selected) => set("priorityId", selected)}
                    />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Status" className="enquiry-nav-field">
                    <WorkspaceLookup
                      allowTextValue={false}
                      clearable={false}
                      createMode="inline"
                      createLabel="Create Status"
                      showCreateWhenEmpty
                      showAllOptionsOnFocus
                      options={statuses
                        .filter(
                          (item) =>
                            item.status === "active" &&
                            (record?.status === "closed" || item.code !== "closed")
                        )
                        .map((item) => ({
                          label: item.name,
                          value: String(item.id),
                          leadingIcon: statusIcon(item.code ?? "")
                        }))}
                      value={value.statusId ? String(value.statusId) : ""}
                      onCreate={createMaster.status}
                      onTextChange={() => set("statusId", "")}
                      onValueChange={(selected) => set("statusId", selected)}
                    />
                  </WorkspaceFormField>
                  {needsOutcome ? (
                    <WorkspaceFormField
                      label="Outcome reason"
                      required
                      className="enquiry-nav-field"
                    >
                      <Textarea
                        value={value.closedReason ?? ""}
                        aria-invalid={Boolean(issues.closedReason)}
                        onChange={(event) => set("closedReason", event.target.value)}
                      />
                      {issues.closedReason ? <FieldError>{issues.closedReason}</FieldError> : null}
                    </WorkspaceFormField>
                  ) : null}
                  <WorkspaceFormField label="Due date" className="enquiry-nav-field">
                    <WorkspaceDateInputPicker
                      value={value.dueDate ?? ""}
                      onValueChange={(date) => set("dueDate", date || null)}
                      onValidityChange={(valid) => {
                        setDueDateInvalid(!valid);
                        if (valid) {
                          setIssues((current) => ({ ...current, dueDate: "" }));
                        }
                      }}
                    />
                    {issues.dueDate ? <FieldError>{issues.dueDate}</FieldError> : null}
                  </WorkspaceFormField>
                </div>
              </section>
            </div>
          </WorkspaceFormBody>
          {record ? (
            <WorkspaceFormActions>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Update enquiry"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
                Cancel
              </Button>
            </WorkspaceFormActions>
          ) : null}
        </WorkspaceFormSurface>
      </form>
      {!record ? (
        <EnquiryMobileContext
          mobile={value.capturedPhone}
          contactId={value.contactId}
          users={users}
          onSeeMoreEnquiries={onSeeMoreEnquiries}
          onOpenEnquiry={onOpenEnquiry}
          onSelectMobile={(mobile) =>
            setCustomer({ capturedPhone: mobile, contactId: null, capturedName: mobile })
          }
        />
      ) : null}
    </WorkspaceUpsertPage>
  );
}

function enquiryNavigationControls(form: HTMLFormElement): HTMLElement[] {
  return Array.from(
    form.querySelectorAll<HTMLElement>(".enquiry-nav-field input, .enquiry-nav-field textarea")
  ).filter((control) => !control.hasAttribute("disabled"));
}

function selectFieldText(control: HTMLElement) {
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    control.select();
  }
}

function FieldError({ children }: { children: string }) {
  return <p className="text-xs text-destructive">{children}</p>;
}

function emptyEnquiry(
  statuses: EnquiryMasterLookup[],
  priorities: EnquiryMasterLookup[]
): EnquirySavePayload {
  return {
    title: "",
    description: null,
    contactId: null,
    capturedName: null,
    capturedEmail: null,
    capturedPhone: null,
    source: "manual",
    sourceReference: null,
    listInId: null,
    statusId: String(statuses.find((item) => item.code === "new")?.id ?? ""),
    priorityId: String(priorities.find((item) => item.code === "normal")?.id ?? ""),
    assignedUserId: null,
    enquiredAt: new Date().toISOString(),
    dueDate: null,
    closedReason: null
  };
}

function fromRecord(record: EnquiryRecord): EnquirySavePayload {
  return {
    title: record.title,
    description: record.description,
    contactId: record.contactId,
    capturedName: record.capturedName,
    capturedEmail: record.capturedEmail,
    capturedPhone: record.capturedPhone,
    source: record.source,
    sourceReference: record.sourceReference,
    listInId: record.listInId,
    statusId: record.statusId,
    priorityId: record.priorityId,
    assignedUserId: record.assignedUserId,
    enquiredAt: new Date(record.enquiredAt).toISOString(),
    dueDate: record.dueDate,
    closedReason: record.closedReason
  };
}

function normalize(value: EnquirySavePayload): EnquirySavePayload {
  return {
    ...value,
    title: value.title.trim(),
    source: value.source.trim(),
    description: value.description?.trim() || null,
    capturedName: value.capturedName?.trim() || null,
    capturedEmail: value.capturedEmail?.trim() || null,
    capturedPhone: value.capturedPhone?.trim() || null,
    sourceReference: value.sourceReference?.trim() || null,
    closedReason: value.closedReason?.trim() || null
  };
}

function titleFromMessage(message: string | null) {
  return Array.from((message ?? "").replace(/\s+/gu, " ").trim())
    .slice(0, 100)
    .join("");
}
