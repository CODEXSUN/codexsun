import { PurchaseWorkspace as OwnedPurchaseWorkspace } from "@codexsun/billing-web/modules/purchase";

export function PurchaseWorkspace({ initialRecordId }: { initialRecordId?: string | undefined }) {
  return <OwnedPurchaseWorkspace initialRecordId={initialRecordId} />;
}
