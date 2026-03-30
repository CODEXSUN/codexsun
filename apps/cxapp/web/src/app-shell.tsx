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
import { GlobalLoader } from "@/components/ui/global-loader"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { ProjectDefaultsProvider } from "@/features/design-system/context/project-defaults-provider"
import AdminLayout from "@/layouts/AdminLayout"
import type { DashboardUser } from "@/features/dashboard/types"

import { useAuth } from "./auth/auth-context"
import { AuthProvider } from "./auth/auth-provider"
import { DeskProvider } from "./desk/desk-provider"
import { FrameworkAppWorkspacePage } from "./pages/framework-app-workspace-page"
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
