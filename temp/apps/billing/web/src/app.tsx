import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { RequireAuth } from '@framework-core/web/auth/components/require-auth'
import { BillingAppShell } from './features/billing/components/billing-app-shell'
import {
  BillingContraVoucherPage,
  BillingGstCenterPage,
  BillingJournalVoucherPage,
  BillingLedgerGroupPage,
  BillingLedgerListPage,
  BillingOverviewPage,
  BillingPaymentVoucherPage,
  BillingPurchaseVoucherPage,
  BillingReceiptVoucherPage,
  BillingSalesInvoicePage,
  BillingVoucherGroupPage,
  BillingVoucherPage,
  BillingLoginPage,
  BillingForgotPasswordPage,
} from './features/billing/pages'

function BillingIndexRedirect() {
  const { isAuthenticated, session } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login?workspace=billing" replace />
  }

  if (session?.user.actorType === 'customer') {
    return <Navigate to="/login?workspace=billing" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export function BillingApp() {
  return (
    <Routes>
      <Route path="/" element={<BillingIndexRedirect />} />
      <Route path="/login" element={<BillingLoginPage />} />
      <Route path="/forgot-password" element={<BillingForgotPasswordPage />} />
      <Route element={<RequireAuth allow={['admin', 'staff', 'vendor']} />}>
        <Route element={<BillingAppShell />}>
          <Route path="/dashboard" element={<BillingOverviewPage />} />
          <Route path="/ledger-groups" element={<BillingLedgerGroupPage />} />
          <Route path="/ledgers" element={<BillingLedgerListPage />} />
          <Route path="/voucher-groups" element={<BillingVoucherGroupPage />} />
          <Route path="/vouchers" element={<BillingVoucherPage />} />
          <Route path="/invoices" element={<BillingSalesInvoicePage />} />
          <Route path="/purchases" element={<BillingPurchaseVoucherPage />} />
          <Route path="/receipts" element={<BillingReceiptVoucherPage />} />
          <Route path="/payments" element={<BillingPaymentVoucherPage />} />
          <Route path="/journals" element={<BillingJournalVoucherPage />} />
          <Route path="/contra" element={<BillingContraVoucherPage />} />
          <Route path="/gst" element={<BillingGstCenterPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
