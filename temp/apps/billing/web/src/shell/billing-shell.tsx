import { BrowserRouter } from 'react-router-dom'
import { AppToaster } from '@admin-web/components/ui/sonner'
import { SetupProvider } from '@admin-web/features/setup/components/setup-provider'
import { BrandingProvider } from '@admin-web/shared/branding/branding-provider'
import { AuthProvider } from '@framework-core/web/auth/components/auth-provider'
import { ThemeProvider } from '@framework-core/web/theme/theme-provider'
import { BillingApp } from '@billing-web/app'

export function BillingShellRoot() {
  return (
    <ThemeProvider>
      <SetupProvider>
        <BrandingProvider>
          <AuthProvider>
            <BrowserRouter>
              <BillingApp />
              <AppToaster />
            </BrowserRouter>
          </AuthProvider>
        </BrandingProvider>
      </SetupProvider>
    </ThemeProvider>
  )
}
