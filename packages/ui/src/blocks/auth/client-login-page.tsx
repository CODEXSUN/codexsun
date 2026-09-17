import { LoginPage, type LoginPageProps } from './login-page'

export function ClientLoginPage(
  props: Omit<
    LoginPageProps,
    'description' | 'forgotHref' | 'registerHref' | 'title' | 'variant'
  > & {
    registrationEnabled?: boolean
  },
) {
  return (
    <LoginPage
      {...props}
      description="Sign in to your workspace."
      forgotHref="/password/forgot"
      registerHref={props.registrationEnabled ? '/register' : null}
      title="Welcome back"
    />
  )
}
