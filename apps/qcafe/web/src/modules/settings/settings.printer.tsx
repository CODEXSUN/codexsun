import { useEffect, useState } from "react";
import { cloudRequest } from "../../web/transport";
export function KotPrinterSetting({
  value,
  disabled,
  onChange
}: {
  value: string;
  disabled: boolean;
  onChange: (target: string) => void;
}) {
  const [printers, setPrinters] = useState<
    { name: string; interactive: boolean; isDefault: boolean }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void cloudRequest<typeof printers>("/api/app/qcafe/kitchen/printers")
      .then(setPrinters)
      .catch((e) => setError(e instanceof Error ? e.message : "Cannot list printers."));
  }, []);
  return (
    <label>
      KOT printer
      <select
        aria-label="KOT printer"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="system-default">System default (physical printer required)</option>
        {printers.map((printer) => (
          <option key={printer.name} value={printer.name} disabled={printer.interactive}>
            {printer.name}
            {printer.interactive ? " · File printer unavailable" : ""}
          </option>
        ))}
        {value !== "system-default" && !printers.some((row) => row.name === value) && (
          <option value={value}>{value} · Unavailable</option>
        )}
      </select>
      {error && <p role="alert">{error}</p>}
      <small>
        Uses the Windows printers installed on the API host. Tokens are queued without opening a
        browser print dialog. A spooler acknowledgement does not confirm paper output.
      </small>
    </label>
  );
}
