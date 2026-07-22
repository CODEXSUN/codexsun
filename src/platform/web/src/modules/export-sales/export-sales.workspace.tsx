import { ExportSalesWorkspace as OwnedExportSalesWorkspace } from "@codexsun/billing-web/modules/export-sales";

export function ExportSalesWorkspace({
  initialRecordId
}: {
  initialRecordId?: string | undefined;
}) {
  return <OwnedExportSalesWorkspace initialRecordId={initialRecordId} />;
}
