export class IdentityAuthenticationError extends Error {
  readonly code = 'INVALID_CREDENTIALS'
}

export class IdentityConflictError extends Error {
  readonly code = 'IDENTITY_CONFLICT'
}

export class IdentityPortalError extends Error {
  readonly code = 'PORTAL_ACCESS_DENIED'
}
