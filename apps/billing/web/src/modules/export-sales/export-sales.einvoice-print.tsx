import { QRCodeSVG } from "qrcode.react";

export function ExportSaleEinvoicePrint({
  einvoice
}: {
  einvoice: { irn: string; ackNo: string; ackDate: string; signedQr: string; status: string };
}) {
  if (!einvoice.irn.trim()) return null;
  return (
    <section
      aria-label="E-invoice details"
      className="flex break-inside-avoid items-start gap-3 border-b border-slate-300 bg-white p-2 text-[10px] text-black"
    >
      {einvoice.signedQr.trim() ? (
        <QRCodeSVG
          value={einvoice.signedQr.trim()}
          size={192}
          level="M"
          marginSize={4}
          title="E-invoice signed QR code"
          className="h-[50mm] w-[50mm] shrink-0"
        />
      ) : (
        <span>Signed QR code unavailable</span>
      )}
      <dl className="min-w-0 space-y-1">
        <dt className="font-semibold">
          E-invoice {einvoice.status === "cancelled" ? "- CANCELLED" : ""}
        </dt>
        <dt>IRN</dt>
        <dd className="break-all font-semibold">{einvoice.irn}</dd>
        <dt>Acknowledgement number</dt>
        <dd className="break-all">{einvoice.ackNo || "Unavailable"}</dd>
        <dt>Acknowledgement date</dt>
        <dd>{einvoice.ackDate || "Unavailable"}</dd>
      </dl>
    </section>
  );
}
