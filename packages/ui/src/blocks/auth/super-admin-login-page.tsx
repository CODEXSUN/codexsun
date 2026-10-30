import { LoginPage, type LoginPageProps } from './login-page'

export function SuperAdminLoginPage(
  props: Omit<LoginPageProps, 'description' | 'forgotHref' | 'registerHref' | 'title' | 'variant'>,
) {
  return (
    <LoginPage
      {...props}
      description="This desk controls system-wide identity and policy."
      forgotHref="/sa/password/forgot"
      registerHref={null}
      title="Super administrator sign in"
    />
  )
}
