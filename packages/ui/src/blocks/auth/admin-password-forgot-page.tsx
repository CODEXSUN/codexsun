import { PasswordForgotPage, type PasswordForgotPageProps } from './password-forgot-page'

export function AdminPasswordForgotPage(props: Omit<PasswordForgotPageProps, 'backHref'>) {
  return <PasswordForgotPage {...props} backHref="/admin/login" />
}
