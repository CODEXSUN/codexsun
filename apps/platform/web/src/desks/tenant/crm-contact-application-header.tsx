type ContactApplicationHeaderRecord = {
  code: string;
  name: string;
  primaryPhone: string | null;
};

export function CrmContactApplicationHeader({
  contact
}: {
  contact: ContactApplicationHeaderRecord | null;
}) {
  return (
    <header
      aria-label="Contact application header"
      className="flex min-h-10 shrink-0 items-center border-b bg-background px-4"
    >
      {contact ? (
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="truncate text-sm font-semibold text-foreground">{contact.name}</span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {contact.primaryPhone || "No mobile"}
          </span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{contact.code}</span>
        </div>
      ) : null}
    </header>
  );
}
