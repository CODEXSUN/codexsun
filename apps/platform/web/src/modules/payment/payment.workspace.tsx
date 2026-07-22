import { PaymentWorkspace as OwnedPaymentWorkspace } from "@codexsun/billing-web/modules/payment";
export function PaymentWorkspace({ initialRecordId }: { initialRecordId?: string | undefined }) {
  return <OwnedPaymentWorkspace initialRecordId={initialRecordId} />;
}
