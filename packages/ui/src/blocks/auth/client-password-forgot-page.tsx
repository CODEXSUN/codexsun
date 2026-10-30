import { PasswordForgotPage, type PasswordForgotPageProps } from './password-forgot-page'

export function ClientPasswordForgotPage(props: Omit<PasswordForgotPageProps, 'backHref'>) {
  return <PasswordForgotPage {...props} backHref="/login" />
}
