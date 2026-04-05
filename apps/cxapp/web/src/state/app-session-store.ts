import { create } from "zustand"

import type { AuthUser } from "@cxapp/shared"

import {
  isAdminSurfaceUser,
  isCustomerSurfaceUser,
  resolveAuthenticatedHomePath,
} from "../auth/auth-surface"

type AppSurface = "guest" | "admin" | "customer" | "desk"

type AppSessionState = {
  user: AuthUser | null
  email: string | null
  surface: AppSurface
  homePath: string
  isAuthenticated: boolean
  isLoading: boolean
  setSessionState: (payload: { user: AuthUser | null; isLoading: boolean }) => void
}

function resolveSurface(user: AuthUser | null): AppSurface {
  if (!user) {
    return "guest"
  }

  if (isAdminSurfaceUser(user)) {
    return "admin"
  }

  if (isCustomerSurfaceUser(user)) {
    return "customer"
  }

  return "desk"
}

export const useAppSessionStore = create<AppSessionState>((set) => ({
  user: null,
  email: null,
  surface: "guest",
  homePath: "/login",
  isAuthenticated: false,
  isLoading: true,
  setSessionState: ({ user, isLoading }) =>
    set({
      user,
      email: user?.email ?? null,
      surface: resolveSurface(user),
      homePath: resolveAuthenticatedHomePath(user),
      isAuthenticated: Boolean(user),
      isLoading,
    }),
}))
