import { PasswordForgotPage, type PasswordForgotPageProps } from './password-forgot-page'

export function SuperAdminPasswordForgotPage(props: Omit<PasswordForgotPageProps, 'backHref'>) {
  return <PasswordForgotPage {...props} backHref="/sa/login" />
}
