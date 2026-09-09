export type ZetroProject = {
  archived: boolean
  createdAt: string
  githubUrl: string
  id: string
  logoColor: string
  logoText: string
  name: string
  repositoryPath: string
  tagline: string
  updatedAt: string
}

export type ProjectUpdate = {
  archived?: boolean
  githubUrl?: string
  logoColor?: string
  logoText?: string
  name?: string
  repositoryPath?: string
  tagline?: string
}

export type ProjectDirectoryListing = {
  directories: Array<{ name: string; path: string }>
  parentPath: string | null
  path: string
}
