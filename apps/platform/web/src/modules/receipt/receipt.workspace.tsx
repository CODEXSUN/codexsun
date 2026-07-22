import { ReceiptWorkspace as OwnedReceiptWorkspace } from "@codexsun/billing-web/modules/receipt";
export function ReceiptWorkspace({ initialRecordId }: { initialRecordId?: string | undefined }) {
  return <OwnedReceiptWorkspace initialRecordId={initialRecordId} />;
}
