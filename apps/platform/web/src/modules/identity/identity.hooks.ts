import type { IdentityPortal } from '@codexsun/platform-contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { devLogin, login, logout, readIdentityConfig, readSession } from './identity.services'

export function useIdentityProfile(path: string, enabled: boolean) {
  const portal: IdentityPortal = /^\/sa(?:\/|$)/u.test(path)
    ? 'super-admin'
    : /^\/admin(?:\/|$)/u.test(path)
      ? 'administrator'
      : 'regular'
  const loginPath =
    portal === 'super-admin' ? '/sa/login' : portal === 'administrator' ? '/admin/login' : '/login'
  const queryClient = useQueryClient()
  const session = useQuery({
    enabled,
    queryKey: ['identity', 'session', portal],
    queryFn: () => readSession(portal),
    retry: false,
  })
  const signOut = useMutation({
    mutationFn: () => logout(portal),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['identity', 'session', portal] })
      window.location.replace(loginPath)
    },
  })
  return {
    status: signOut.isError
      ? 'Sign out failed. Retry from your profile.'
      : signOut.isPending
        ? 'Signing out…'
        : undefined,
    user: {
      name: session.data?.user.displayName ?? 'Signed out',
      email: session.data?.user.email,
      initials: session.data?.user.displayName.slice(0, 1).toUpperCase() ?? '?',
      onSignOut: () => {
        if (!signOut.isPending) signOut.mutate()
      },
    },
  }
}

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
