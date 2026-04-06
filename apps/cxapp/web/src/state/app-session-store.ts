import { create } from "zustand"

import type { AuthUser } from "@cxapp/shared"

import {
  createAppSessionProfile,
  type AppLayoutKind,
  type AppSurface,
} from "../auth/auth-surface"
import { readCachedAppSessionState } from "../auth/app-session-cache"

type AppSessionState = {
  user: AuthUser | null
  email: string | null
  surface: AppSurface
  homePath: string
  loginPath: string
  layoutKind: AppLayoutKind
  isAuthenticated: boolean
  isLoading: boolean
  access: {
    admin: boolean
    customer: boolean
    web: boolean
    desk: boolean
  }
  behaviors: {
    useAdminShell: boolean
    useCustomerShell: boolean
    useWebDashboard: boolean
    useDeskDashboard: boolean
  }
  setSessionState: (payload: { user: AuthUser | null; isLoading: boolean }) => void
}

const cachedSessionState = readCachedAppSessionState()
const guestProfile = createAppSessionProfile(null)

export const useAppSessionStore = create<AppSessionState>((set) => ({
  user: cachedSessionState?.user ?? null,
  email: cachedSessionState?.profile.email ?? guestProfile.email,
  surface: cachedSessionState?.profile.surface ?? guestProfile.surface,
  homePath: cachedSessionState?.profile.homePath ?? guestProfile.homePath,
  loginPath: cachedSessionState?.profile.loginPath ?? guestProfile.loginPath,
  layoutKind: cachedSessionState?.profile.layoutKind ?? guestProfile.layoutKind,
  isAuthenticated:
    cachedSessionState?.profile.isAuthenticated ?? guestProfile.isAuthenticated,
  isLoading: true,
  access: cachedSessionState?.profile.access ?? guestProfile.access,
  behaviors: cachedSessionState?.profile.behaviors ?? guestProfile.behaviors,
  setSessionState: ({ user, isLoading }) =>
    set(() => {
      const profile = createAppSessionProfile(user)

      return {
      user,
      email: profile.email,
      surface: profile.surface,
      homePath: profile.homePath,
      loginPath: profile.loginPath,
      layoutKind: profile.layoutKind,
      isAuthenticated: profile.isAuthenticated,
      isLoading,
      access: profile.access,
      behaviors: profile.behaviors,
    }}),
}))
