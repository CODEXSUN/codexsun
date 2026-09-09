export interface ZetroProject {
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

export interface CreateProjectInput {
  name: string
  repositoryPath: string
}

export interface UpdateProjectInput {
  archived?: boolean
  githubUrl?: string
  logoColor?: string
  logoText?: string
  name?: string
  repositoryPath?: string
  tagline?: string
}

export interface ProjectDirectoryListing {
  directories: Array<{ name: string; path: string }>
  parentPath: string | null
  path: string
}
