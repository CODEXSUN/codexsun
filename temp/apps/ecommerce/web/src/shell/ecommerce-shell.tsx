import { AuthProvider } from '@framework-core/web/auth/components/auth-provider'
import { ThemeProvider } from '@framework-core/web/theme/theme-provider'
import { App } from '@/App'
import { SetupProvider } from '@/features/setup/components/setup-provider'
import { BrandingProvider } from '@/shared/branding/branding-provider'

export function EcommerceShellRoot() {
  return (
    <ThemeProvider>
      <SetupProvider>
        <BrandingProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrandingProvider>
      </SetupProvider>
    </ThemeProvider>
  )
}
