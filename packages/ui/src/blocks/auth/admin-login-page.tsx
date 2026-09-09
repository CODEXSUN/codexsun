import { LoginPage, type LoginPageProps } from './login-page'

export function AdminLoginPage(
  props: Omit<LoginPageProps, 'description' | 'forgotHref' | 'registerHref' | 'title' | 'variant'>,
) {
  return (
    <LoginPage
      {...props}
      description="Use an administrator account for this isolated desk."
      forgotHref="/admin/password/forgot"
      registerHref={undefined}
      title="Administrator sign in"
    />
  )
}
