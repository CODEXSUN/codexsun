import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react"

import type { AppSuite } from "@framework/application/app-manifest"
import { createFrameworkBrowserContainer } from "@framework/di/browser-container"
import { FRAMEWORK_TOKENS } from "@framework/di/tokens"
import type { AuthUser } from "@cxapp/shared"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"
import { RuntimeBrandProvider } from "@/features/branding/runtime-brand-provider"
import { ProjectDefaultsProvider } from "@/design-system/context/project-defaults-provider"
import { Toaster } from "@/components/ui/sonner"
import type { DashboardUser } from "@/features/dashboard/types"
import { StorefrontCartProvider } from "@ecommerce/web/src/cart/storefront-cart"
import { storefrontPaths } from "@ecommerce/web/src/lib/storefront-routes"

import { useAuth } from "./auth/auth-context"
import { AuthProvider } from "./auth/auth-provider"
import {
  isAdminSurfaceUser,
  isCustomerSurfaceUser,
  isDeskSurfaceUser,
  isWebSurfaceUser,
  resolveAuthenticatedHomePath,
} from "./auth/auth-surface"
import {
  isAppFrontendSurface,
  isShopFrontendSurface,
} from "./config/frontend-surface"
import { DeskProvider } from "./desk/desk-provider"
import {
  RuntimeAppSettingsProvider,
  useRuntimeAppSettings,
} from "./features/runtime-app-settings/runtime-app-settings-provider"
import { AppQueryProvider } from "./query/query-provider"
import { useAppSessionStore } from "./state/app-session-store"

function lazyNamed<TModule extends Record<string, unknown>, TKey extends keyof TModule>(
  load: () => Promise<TModule>,
  exportName: TKey
): LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => {
    const module = await load()

    return {
      default: module[exportName] as ComponentType<any>,
    }
  })
}

const SiteHomePage = lazy(() => import("@site/web/src/pages/home"))
const DashboardPage = lazyNamed(
  () => import("@/features/dashboard/pages/dashboard-page"),
  "DashboardPage"
)
const BaseAdminLayout = lazy(() => import("@/layouts/AdminLayout"))
const StorefrontAccountOrderPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-order-page"),
  "StorefrontAccountOrderPage"
)
const StorefrontAccountPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-page"),
  "StorefrontAccountPage"
)
const StorefrontAccountRegisterPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-account-register-page"),
  "StorefrontAccountRegisterPage"
)
const StorefrontCartPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-cart-page"),
  "StorefrontCartPage"
)
const StorefrontCatalogPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-catalog-page"),
  "StorefrontCatalogPage"
)
const StorefrontCheckoutPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-checkout-page"),
  "StorefrontCheckoutPage"
)
const StorefrontHomePage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-home-page"),
  "StorefrontHomePage"
)
const StorefrontProductPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-product-page"),
  "StorefrontProductPage"
)
const StorefrontTrackOrderPage = lazyNamed(
  () => import("@ecommerce/web/src/pages/storefront-track-order-page"),
  "StorefrontTrackOrderPage"
)
const BillingVoucherSectionPage = lazyNamed(
  () => import("./pages/billing-voucher-section-page"),
  "BillingVoucherSectionPage"
)
const BillingWorkspacePage = lazyNamed(
  () => import("./pages/billing-workspace-page"),
  "BillingWorkspacePage"
)
const CoreCompanyDetailPage = lazyNamed(
  () => import("./pages/core-company-detail-page"),
  "CoreCompanyDetailPage"
)
const CoreCompanyFormPage = lazyNamed(
  () => import("./pages/core-company-form-page"),
  "CoreCompanyFormPage"
)
const CoreContactDetailPage = lazyNamed(
  () => import("./pages/core-contact-detail-page"),
  "CoreContactDetailPage"
)
const CoreContactFormPage = lazyNamed(
  () => import("./pages/core-contact-form-page"),
  "CoreContactFormPage"
)
const CoreProductDetailPage = lazyNamed(
  () => import("./pages/core-product-detail-page"),
  "CoreProductDetailPage"
)
const CoreProductFormPage = lazyNamed(
  () => import("./pages/core-product-form-page"),
  "CoreProductFormPage"
)
const EcommerceProductDetailPage = lazyNamed(
  () => import("./pages/ecommerce-product-detail-page"),
  "EcommerceProductDetailPage"
)
const EcommerceProductFormPage = lazyNamed(
  () => import("./pages/ecommerce-product-form-page"),
  "EcommerceProductFormPage"
)
const BillingCategoryFormPage = lazyNamed(
  () => import("./pages/billing-category-form-page"),
  "BillingCategoryFormPage"
)
const BillingLedgerFormPage = lazyNamed(
  () => import("./pages/billing-ledger-form-page"),
  "BillingLedgerFormPage"
)
const BillingPaymentFormPage = lazyNamed(
  () => import("./pages/billing-payment-form-page"),
  "BillingPaymentFormPage"
)
const BillingPurchaseFormPage = lazyNamed(
  () => import("./pages/billing-purchase-form-page"),
  "BillingPurchaseFormPage"
)
const BillingReceiptFormPage = lazyNamed(
  () => import("./pages/billing-receipt-form-page"),
  "BillingReceiptFormPage"
)
const BillingSalesFormPage = lazyNamed(
  () => import("./pages/billing-sales-form-page"),
  "BillingSalesFormPage"
)
const FrameworkAppWorkspacePage = lazyNamed(
  () => import("./pages/framework-app-workspace-page"),
  "FrameworkAppWorkspacePage"
)
const FrameworkMediaManagerPage = lazyNamed(
  () => import("./pages/framework-media-manager-page"),
  "FrameworkMediaManagerPage"
)
const FrameworkRbacPage = lazyNamed(
  () => import("./pages/framework-rbac-page"),
  "FrameworkRbacPage"
)
const FrameworkPermissionFormPage = lazyNamed(
  () => import("./pages/framework-permission-form-page"),
  "FrameworkPermissionFormPage"
)
const FrameworkRoleFormPage = lazyNamed(
  () => import("./pages/framework-role-form-page"),
  "FrameworkRoleFormPage"
)
const FrameworkSystemUpdatePage = lazyNamed(
  () => import("./pages/framework-system-update-page"),
  "FrameworkSystemUpdatePage"
)
const FrameworkUserDetailPage = lazyNamed(
  () => import("./pages/framework-user-detail-page"),
  "FrameworkUserDetailPage"
)
const FrameworkUserFormPage = lazyNamed(
  () => import("./pages/framework-user-form-page"),
  "FrameworkUserFormPage"
)
const FrameworkUsersPage = lazyNamed(
  () => import("./pages/framework-users-page"),
  "FrameworkUsersPage"
)
const ForgotPasswordPage = lazyNamed(
  () => import("./pages/forgot-password-page"),
  "ForgotPasswordPage"
)
const LoginPage = lazyNamed(
  () => import("./pages/login-page"),
  "LoginPage"
)
const RequestAccessPage = lazyNamed(
  () => import("./pages/request-access-page"),
  "RequestAccessPage"
)
const WebUserDashboardPage = lazyNamed(
  () => import("./pages/web-user-dashboard-page"),
  "WebUserDashboardPage"
)

const container = createFrameworkBrowserContainer()
const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)
const adminDashboardPath = "/admin/dashboard"
const guestUser: DashboardUser = {
  displayName: "Guest Operator",
  email: "guest@codexsun.local",
  avatarUrl: null,
  actorType: "guest",
  isSuperAdmin: false,
}

function toDashboardUser(user: AuthUser | null | undefined): DashboardUser {
  if (!user) {
    return guestUser
  }

  return {
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    actorType: user.actorType,
    isSuperAdmin: user.isSuperAdmin,
  }
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

function ProtectedRoute({
  children,
  allow,
}: {
  children: React.ReactNode
  allow?: (user: AuthUser) => boolean
}) {
  const location = useLocation()
  const auth = useAuth()
  const homePath = useAppSessionStore((state) => state.homePath)

  if (auth.isLoading) {
    return (
      <GlobalLoader size="md" />
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

  if (auth.user) {
    const isAllowed = allow ? allow(auth.user) : isDeskSurfaceUser(auth.user)

    if (!isAllowed) {
      return <Navigate to={homePath || resolveAuthenticatedHomePath(auth.user)} replace />
    }
  }

  if (!auth.user) {
    return <Navigate to={homePath || resolveAuthenticatedHomePath(auth.user)} replace />
  }

  return children
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeBrandProvider>
      <RuntimeAppSettingsProvider>
        <ProjectDefaultsProvider>
          <StorefrontCartProvider>
            <AppToastLayer />
            {children}
          </StorefrontCartProvider>
        </ProjectDefaultsProvider>
      </RuntimeAppSettingsProvider>
    </RuntimeBrandProvider>
  )
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <DeskProvider
      appSuite={appSuite}
      user={toDashboardUser(auth.user)}
      onLogout={() => {
        void auth.logout()
      }}
    >
      <BaseAdminLayout>{children}</BaseAdminLayout>
    </DeskProvider>
  )
}

function AuthenticatedAppShell() {
  const auth = useAuth()

  return (
    <AppProviders>
      <Suspense fallback={<GlobalLoader size="md" />}>
        <Routes>
          <Route
            path="/"
            element={
              isShopFrontendSurface ? (
                <StorefrontHomePage />
              ) : isAppFrontendSurface ? (
                <Navigate to="/login" replace />
              ) : (
                <SiteHomePage appSuite={appSuite} />
              )
            }
          />
          {isShopFrontendSurface ? (
            <>
              <Route path="/catalog" element={<StorefrontCatalogPage />} />
              <Route path="/products/:slug" element={<StorefrontProductPage />} />
              <Route path="/cart" element={<StorefrontCartPage />} />
              <Route path="/checkout" element={<StorefrontCheckoutPage />} />
              <Route path="/track-order" element={<StorefrontTrackOrderPage />} />
              <Route
                path="/profile/login"
                element={<Navigate to={storefrontPaths.accountLogin(storefrontPaths.account())} replace />}
              />
              <Route path="/profile/register" element={<StorefrontAccountRegisterPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:sectionId"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/orders/:orderId"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/account/login" element={<Navigate to={storefrontPaths.accountLogin()} replace />} />
              <Route path="/account/register" element={<Navigate to={storefrontPaths.accountRegister()} replace />} />
              <Route path="/account" element={<Navigate to={storefrontPaths.account()} replace />} />
              <Route
                path="/account/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
              <Route path="/shop" element={<StorefrontHomePage />} />
              <Route path="/shop/catalog" element={<StorefrontCatalogPage />} />
              <Route path="/shop/products/:slug" element={<StorefrontProductPage />} />
              <Route path="/shop/cart" element={<StorefrontCartPage />} />
              <Route path="/shop/checkout" element={<StorefrontCheckoutPage />} />
              <Route path="/shop/track-order" element={<StorefrontTrackOrderPage />} />
              <Route
                path="/shop/profile/login"
                element={<Navigate to={storefrontPaths.accountLogin(storefrontPaths.account())} replace />}
              />
              <Route path="/shop/profile/register" element={<StorefrontAccountRegisterPage />} />
              <Route
                path="/shop/profile"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/profile/:sectionId"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/profile/orders/:orderId"
                element={
                  <ProtectedRoute allow={isCustomerSurfaceUser}>
                    <StorefrontAccountOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/shop/account/login" element={<Navigate to={storefrontPaths.accountLogin()} replace />} />
              <Route path="/shop/account/register" element={<Navigate to={storefrontPaths.accountRegister()} replace />} />
              <Route path="/shop/account" element={<Navigate to={storefrontPaths.account()} replace />} />
              <Route
                path="/shop/account/orders/:orderId"
                element={<Navigate to={storefrontPaths.account()} replace />}
              />
            </>
          ) : null}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allow={(user) => isDeskSurfaceUser(user) || isWebSurfaceUser(user)}>
                {isWebSurfaceUser(auth.user) ? (
                  <WebUserDashboardPage />
                ) : (
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path={adminDashboardPath}
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <DashboardPage variant="admin" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={<Navigate to={adminDashboardPath} replace />}
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
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
            path="/dashboard/settings/core-setup"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage appId="core" sectionId="setup" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/core-settings"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage appId="core" sectionId="core-settings" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkAppWorkspacePage appId="core" sectionId="companies" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/:companyId"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/companies/:companyId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <CoreCompanyFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/:userId"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/users/:userId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkUserFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRbacPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/roles/:roleId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="list" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="form" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/permissions/:permissionId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkPermissionFormPage mode="form" />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRbacPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac/new"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings/rbac/:roleId/edit"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkRoleFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/core/setup"
            element={<Navigate to="/dashboard/settings/core-setup" replace />}
          />
          <Route
            path="/dashboard/apps/core/core-settings"
            element={<Navigate to="/dashboard/settings/core-settings" replace />}
          />
          <Route
            path="/dashboard/media"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkMediaManagerPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/system-update"
            element={
              <ProtectedRoute allow={isAdminSurfaceUser}>
                <AdminLayout>
                  <FrameworkSystemUpdatePage />
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
            path="/dashboard/apps/ecommerce/products/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductFormPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ecommerce/products/:productId"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/apps/ecommerce/products/:productId/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <EcommerceProductFormPage />
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
      </Suspense>
    </AppProviders>
  )
}

function AppToastLayer() {
  const { settings } = useRuntimeAppSettings()

  return (
    <Toaster
      position={settings?.uiFeedback.toast.position ?? "top-right"}
      tone={settings?.uiFeedback.toast.tone ?? "soft"}
      closeButton
    />
  )
}

function AppShell() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppQueryProvider>
          <AuthenticatedAppShell />
        </AppQueryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppShell
