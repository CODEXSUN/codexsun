import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ContactQuickEditDialog } from "@codexsun/core-web/modules/master/contact";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormField } from "@codexsun/ui/workspace/upsert";
import type { EnquiryLookup, EnquirySavePayload } from "./enquiry.types";
import { enquiryPhoneKey } from "./enquiry.phone";

type CustomerValue = Pick<EnquirySavePayload, "contactId" | "capturedName" | "capturedPhone">;

export function EnquiryCustomerFields({
  customerRequired = true,
  autoFocusMobile = false,
  strictMobile = false,
  contacts,
  loading,
  value,
  error,
  mobileError,
  onChange,
  onContactSaved
}: {
  customerRequired?: boolean;
  autoFocusMobile?: boolean;
  strictMobile?: boolean;
  contacts: EnquiryLookup[];
  loading: boolean;
  value: CustomerValue;
  error: string;
  mobileError: string;
  onChange: (next: Partial<CustomerValue>) => void;
  onContactSaved: () => Promise<void>;
}) {
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [manualName, setManualName] = useState(
    Boolean(value.capturedName && value.capturedName !== value.capturedPhone && !value.contactId)
  );
  const matches = useMemo(
    () => matchingContacts(contacts, value.capturedPhone, strictMobile),
    [contacts, value.capturedPhone, strictMobile]
  );

  useEffect(() => {
    if (value.contactId || matches.length !== 1) return;
    onChange({ contactId: Number(matches[0]!.id), capturedName: null });
  }, [matches, onChange, value.contactId]);

  const options = contacts
    .filter((contact) => contact.status === "active")
    .sort((left, right) => Number(matches.includes(right)) - Number(matches.includes(left)))
    .map((contact) => ({
      value: String(contact.id),
      label: contact.name,
      ...(contact.primaryPhone ? { description: contact.primaryPhone } : {})
    }));
  const mobileDigits = enquiryPhoneKey(value.capturedPhone);
  const mobileIsInvalid = Boolean(
    strictMobile && value.capturedPhone && !/^\d{10}$/.test(value.capturedPhone)
  );
  const showMobileFormatError = Boolean(
    mobileIsInvalid &&
    value.capturedPhone &&
    (value.capturedPhone.length >= 10 || /\D/.test(value.capturedPhone))
  );
  const selectedContact = contacts.find((contact) => contact.id === value.contactId);

  return (
    <>
      <WorkspaceFormField label="Mobile no" className="enquiry-nav-field">
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus={autoFocusMobile}
          aria-invalid={Boolean(mobileError || showMobileFormatError)}
          className={
            matches.length === 1 && !loading && !mobileError && !mobileIsInvalid
              ? "border-emerald-500 ring-1 ring-emerald-500/35 focus-visible:border-emerald-600 focus-visible:ring-emerald-500/50"
              : undefined
          }
          value={value.capturedPhone ?? ""}
          onChange={(event) => {
            const mobile = event.target.value;
            const found = matchingContacts(contacts, mobile, strictMobile);
            if (found.length === 1) {
              setManualName(false);
              onChange({
                capturedPhone: mobile,
                contactId: Number(found[0]!.id),
                capturedName: null
              });
            } else {
              onChange({
                capturedPhone: mobile,
                contactId: null,
                capturedName: manualName ? value.capturedName : mobile || null
              });
            }
          }}
        />
        {mobileError || showMobileFormatError ? (
          <p className="text-xs text-destructive">
            {mobileError || "Enter a 10-digit mobile number."}
          </p>
        ) : null}
        {mobileDigits.length >= 7 && (!strictMobile || !mobileIsInvalid) ? (
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Searching Core contacts..."
              : matches.length === 1
                ? `Matched Core contact: ${matches[0]!.name}`
                : matches.length > 1
                  ? "Several contacts use this mobile. Choose the customer below."
                  : "A new Core contact will be created when you save."}
          </p>
        ) : null}
      </WorkspaceFormField>
      <WorkspaceFormField
        label="Customer"
        required={customerRequired}
        className="enquiry-nav-field"
      >
        <WorkspaceLookup
          allowTextValue
          options={options}
          placeholder="Search or enter customer"
          value={value.contactId ? String(value.contactId) : (value.capturedName ?? "")}
          invalid={Boolean(error)}
          trailingAction={
            selectedContact ? (
              <button
                aria-label="Edit selected contact"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit selected contact"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingContactId(Number(selectedContact.id));
                }}
              >
                <ArrowUpRight className="size-4" />
              </button>
            ) : undefined
          }
          onValueChange={(selected, option) => {
            const contact = option
              ? contacts.find((item) => item.id === Number(option.value))
              : null;
            setManualName(
              Boolean(!option && selected.trim() && selected.trim() !== value.capturedPhone)
            );
            onChange({
              contactId: contact ? Number(contact.id) : null,
              capturedName: contact ? null : selected || null,
              capturedPhone: value.capturedPhone || contact?.primaryPhone || null
            });
          }}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </WorkspaceFormField>
      <ContactQuickEditDialog
        contactId={editingContactId}
        onOpenChange={(open) => !open && setEditingContactId(null)}
        onSaved={async (contact) => {
          onChange({
            contactId: Number(contact.id),
            capturedName: null,
            capturedPhone: contact.primaryPhone
          });
          await onContactSaved();
        }}
      />
    </>
  );
}

function matchingContacts(contacts: EnquiryLookup[], mobile: string | null, strictMobile: boolean) {
  const key = enquiryPhoneKey(mobile);
  if (strictMobile ? key.length !== 10 || mobile !== key : key.length < 7) return [];
  return contacts.filter(
    (contact) =>
      contact.status === "active" &&
      [contact.primaryPhone, ...(contact.phones ?? []).map((item) => item.phone)].some(
        (phone) => enquiryPhoneKey(phone) === key
      )
  );
}
