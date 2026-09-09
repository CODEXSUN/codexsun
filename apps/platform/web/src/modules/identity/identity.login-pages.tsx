import { AdminLoginPage, ClientLoginPage, SuperAdminLoginPage } from '@codexsun/ui/blocks/auth'
import { useIdentityLogin } from './identity.hooks'

export function ClientIdentityLogin() {
  const state = useIdentityLogin('regular', '/')
  return (
    <ClientLoginPage
      busy={state.busy}
      error={state.error}
      registrationEnabled={state.registrationEnabled}
      onSubmit={state.login}
    />
  )
}

export function AdminIdentityLogin() {
  const state = useIdentityLogin('administrator', '/admin')
  return <AdminLoginPage busy={state.busy} error={state.error} onSubmit={state.login} />
}

export function SuperAdminIdentityLogin() {
  const state = useIdentityLogin('super-admin', '/sa')
  return (
    <SuperAdminLoginPage
      busy={state.busy}
      devLoginEnabled={state.devLoginEnabled}
      error={state.error}
      onDevLogin={state.devLogin}
      onSubmit={state.login}
    />
  )
}
