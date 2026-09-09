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
    mutationFn: ({ email, name, password }: { email: string; name: string; password: string }) =>
      registerAccount(name, email, password),
    onSuccess: () => window.location.assign('/login'),
  })
  return (
    <RegisterPage
      onSubmit={(name, email, password) => registration.mutate({ email, name, password })}
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
