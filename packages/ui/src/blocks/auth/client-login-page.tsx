import { AuthShell } from './auth-shell'
import { AuthLoginForm, type AuthLoginFormProps } from './login-form'

export function ClientLoginPage(
  props: Omit<AuthLoginFormProps, 'forgotHref' | 'registerHref'> & {
    registrationEnabled?: boolean
  },
) {
  return (
    <AuthShell
      eyebrow="Client portal"
      title="Welcome back"
      description="Sign in to your workspace."
    >
      <AuthLoginForm
        {...props}
        forgotHref="/password/forgot"
        registerHref={props.registrationEnabled ? '/register' : undefined}
      />
    </AuthShell>
  )
}
