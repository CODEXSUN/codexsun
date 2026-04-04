import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"

import type { AppSuite } from "@framework/application/app-manifest"
import { createFrameworkBrowserContainer } from "@framework/di/browser-container"
import { FRAMEWORK_TOKENS } from "@framework/di/tokens"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { RuntimeBrandProvider } from "@/features/branding/runtime-brand-provider"
import { ProjectDefaultsProvider } from "@/design-system/context/project-defaults-provider"
import AdminLayout from "@/layouts/AdminLayout"
import type { DashboardUser } from "@/features/dashboard/types"

import { useAuth } from "./auth/auth-context"
import { AuthProvider } from "./auth/auth-provider"
import { DeskProvider } from "./desk/desk-provider"
import { BillingVoucherSectionPage } from "./pages/billing-voucher-section-page"
import { BillingWorkspacePage } from "./pages/billing-workspace-page"
import { CoreCompanyDetailPage } from "./pages/core-company-detail-page"
import { CoreCompanyFormPage } from "./pages/core-company-form-page"
import { CoreContactDetailPage } from "./pages/core-contact-detail-page"
import { CoreContactFormPage } from "./pages/core-contact-form-page"
import { CoreProductDetailPage } from "./pages/core-product-detail-page"
import { CoreProductFormPage } from "./pages/core-product-form-page"
import { BillingCategoryFormPage } from "./pages/billing-category-form-page"
import { BillingLedgerFormPage } from "./pages/billing-ledger-form-page"
import { BillingPaymentFormPage } from "./pages/billing-payment-form-page"
import { BillingPurchaseFormPage } from "./pages/billing-purchase-form-page"
import { BillingReceiptFormPage } from "./pages/billing-receipt-form-page"
import { BillingSalesFormPage } from "./pages/billing-sales-form-page"
import { FrameworkAppWorkspacePage } from "./pages/framework-app-workspace-page"
import { FrameworkMediaManagerPage } from "./pages/framework-media-manager-page"
import { ForgotPasswordPage } from "./pages/forgot-password-page"
import HomePage from "./pages/home"
import { LoginPage } from "./pages/login-page"
import { RequestAccessPage } from "./pages/request-access-page"

const container = createFrameworkBrowserContainer()
const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)
const guestUser: DashboardUser = {
  displayName: "Guest Operator",
  email: "guest@codexsun.local",
  avatarUrl: null,
  actorType: "guest",
  isSuperAdmin: false,
}

function FrameworkUtilityPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Framework
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <GlobalLoader size="md" label="M" />
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return children
}

function AuthenticatedAppShell() {
  const auth = useAuth()
  const user: DashboardUser = auth.user
    ? {
        displayName: auth.user.displayName,
        email: auth.user.email,
        avatarUrl: auth.user.avatarUrl,
        actorType: auth.user.actorType,
        isSuperAdmin: auth.user.isSuperAdmin,
      }
    : guestUser

  return (
    <RuntimeBrandProvider>
      <ProjectDefaultsProvider>
        <DeskProvider
          appSuite={appSuite}
          user={user}
          onLogout={() => {
            void auth.logout()
          }}
        >
          <Routes>
          <Route path="/" element={<HomePage appSuite={appSuite} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <DashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <DashboardPage variant="admin" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkUtilityPage
                    title="Settings"
                    description="Framework-level configuration, cross-app governance, and suite defaults are staged here. This page is the placeholder for the next real settings modules."
                  />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/media"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkMediaManagerPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/system-update"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkUtilityPage
                    title="System Update"
                    description="Build health, deployment checkpoints, and future update controls will live here once the release workflow grows beyond the current scaffold."
                  />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="chart-of-accounts" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-register"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-register" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-groups"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-groups" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/voucher-types"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="voucher-types" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="payment-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPaymentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/payment-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPaymentFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="receipt-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingReceiptFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/receipt-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingReceiptFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="sales-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="purchase-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/purchase-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingPurchaseFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/contra-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="contra-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/journal-vouchers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="journal-vouchers" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/sales-vouchers/:voucherId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingSalesFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="categories" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCategoryFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/categories/:categoryId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingCategoryFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/credit-note"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="credit-note" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/debit-note"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="debit-note" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/stock"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="stock" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/statements"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="statements" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/day-book"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="day-book" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/double-entry"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="double-entry" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingLedgerFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/chart-of-accounts/:ledgerId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingLedgerFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/trial-balance"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="trial-balance" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/profit-and-loss"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="profit-and-loss" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/balance-sheet"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="balance-sheet" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/bill-outstanding"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="bill-outstanding" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing/support/ledger-guide"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <BillingVoucherSectionPage sectionId="support-ledger-guide" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/:appId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkAppWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/companies/:companyId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreCompanyDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/companies/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/companies/:companyId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/:contactId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/contacts/:contactId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreContactFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/:productId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/products/:productId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CoreProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/:appId/:sectionId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FrameworkAppWorkspacePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DeskProvider>
      </ProjectDefaultsProvider>
    </RuntimeBrandProvider>
  )
}

function AppShell() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedAppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppShell
