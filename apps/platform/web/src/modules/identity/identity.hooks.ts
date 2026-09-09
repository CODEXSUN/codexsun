import type { IdentityPortal } from '@codexsun/platform-contracts'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { devLogin, login, readIdentityConfig, readSession } from './identity.services'

export function useIdentityLogin(portal: IdentityPortal, destination: string) {
  const config = useQuery({ queryKey: ['identity', 'config'], queryFn: readIdentityConfig })
  const loginMutation = useMutation({
    mutationFn: (input: { identifier: string; password: string }) =>
      login(portal, input.identifier, input.password),
    onSuccess: () => window.location.assign(destination),
  })
  const devMutation = useMutation({
    mutationFn: devLogin,
    onSuccess: () => window.location.assign('/sa'),
  })
  return {
    busy: loginMutation.isPending || devMutation.isPending,
    devLogin: portal === 'super-admin' ? () => devMutation.mutate() : undefined,
    devLoginEnabled: portal === 'super-admin' && Boolean(config.data?.devLoginEnabled),
    error: loginMutation.error?.message ?? devMutation.error?.message,
    login: (identifier: string, password: string) => loginMutation.mutate({ identifier, password }),
    registrationEnabled: Boolean(config.data?.registrationEnabled),
  }
}

export function usePortalSession(portal: IdentityPortal, loginPath: string) {
  const session = useQuery({
    queryKey: ['identity', 'session', portal],
    queryFn: () => readSession(portal),
    retry: false,
  })
  useEffect(() => {
    if (session.isError) window.location.replace(loginPath)
  }, [loginPath, session.isError])
  return session
}
