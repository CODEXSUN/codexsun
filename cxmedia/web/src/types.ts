export type Session = {
  accessToken: string
  expiresInSeconds: number
  tokenType: string
  user: {
    active: boolean
    email: string
    name: string
    role: "admin" | "editor" | "viewer"
  }
}

export type MediaItem = {
  byteSize: number | null
  contentType: string
  createdAt: string | null
  etag: string | null
  path: string
  privateUrl: string
  publicUrl: string
  transformUrls: {
    crop: string
    resize: string
  }
  visibility: "public" | "private"
}

export type SettingsPayload = {
  allowedMimeTypes: string[]
  appName: string
  cdnBaseUrl: string
  defaultUploadVisibility: "public" | "private"
  publicBaseUrl: string
  signedUrlExpiresInSeconds: number
  storage: {
    bucket: string
    endpoint: string
    region: string
  }
  thumborEnabled: boolean
  user: Session["user"]
}

export type AdminUser = {
  active: boolean
  createdAt: string
  email: string
  lastLoginAt: string | null
  name: string
  role: "admin" | "editor" | "viewer"
  updatedAt: string
}

export type FolderNode = {
  name: string
  path: string
  children: FolderNode[]
}

export type ExplorerView = "tiles" | "list"

export type AppSection = "explorer" | "settings" | "users"
