export interface ZetroProject {
  archived: boolean
  createdAt: string
  id: string
  name: string
  repositoryPath: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  repositoryPath: string
}

export interface UpdateProjectInput {
  archived?: boolean
  name?: string
}
