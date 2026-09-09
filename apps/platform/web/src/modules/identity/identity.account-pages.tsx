import {
  AdminPasswordForgotPage as AdminForgotBlock,
  ClientPasswordForgotPage as ClientForgotBlock,
  RegisterPage,
  SuperAdminPasswordForgotPage as SuperAdminForgotBlock,
} from '@codexsun/ui/blocks/auth'
import { useMutation } from '@tanstack/react-query'
import { registerAccount, requestPasswordReset } from './identity.services'

export function IdentityRegisterPage() {
  const registration = useMutation({
    mutationFn: ({
      email,
      mobile,
      name,
      password,
      username,
    }: {
      email: string
      mobile?: string
      name: string
      password: string
      username?: string
    }) => registerAccount(name, email, password, username, mobile),
    onSuccess: () => window.location.assign('/login'),
  })
  return (
    <RegisterPage
      onSubmit={(name, email, password, username, mobile) =>
        registration.mutate({ email, mobile, name, password, username })
      }
    />
  )
}

export function ClientPasswordForgotPage() {
  return <ClientForgotBlock onSubmit={usePasswordReset()} />
}
export function AdminPasswordForgotPage() {
  return <AdminForgotBlock onSubmit={usePasswordReset()} />
}
export function SuperAdminPasswordForgotPage() {
  return <SuperAdminForgotBlock onSubmit={usePasswordReset()} />
}

function usePasswordReset() {
  const request = useMutation({ mutationFn: requestPasswordReset })
  return (email: string) => request.mutate(email)
}
