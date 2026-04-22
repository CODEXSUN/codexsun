export type UserRole = "admin" | "editor" | "viewer"

export type AuthenticatedUser = {
  email: string
  name: string
  role: UserRole
  active: boolean
}

export type StoredUser = AuthenticatedUser & {
  createdAt: string
  passwordHash: string
  updatedAt: string
  lastLoginAt: string | null
}
