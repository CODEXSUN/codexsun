import { AuthShell } from './auth-shell'
import { AuthLoginForm, type AuthLoginFormProps } from './login-form'

export function SuperAdminLoginPage(
  props: Omit<AuthLoginFormProps, 'forgotHref' | 'registerHref'>,
) {
  return (
    <AuthShell
      eyebrow="System control"
      title="Super administrator sign in"
      description="This desk controls system-wide identity and policy."
    >
      <AuthLoginForm {...props} forgotHref="/sa/password/forgot" />
    </AuthShell>
  )
}
