import { AuthShell } from './auth-shell'
import { AuthLoginForm, type AuthLoginFormProps } from './login-form'

export function AdminLoginPage(props: Omit<AuthLoginFormProps, 'forgotHref' | 'registerHref'>) {
  return (
    <AuthShell
      eyebrow="Administration"
      title="Administrator sign in"
      description="Use an administrator account for this isolated desk."
    >
      <AuthLoginForm {...props} forgotHref="/admin/password/forgot" />
    </AuthShell>
  )
}
