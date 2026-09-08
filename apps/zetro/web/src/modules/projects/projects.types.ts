export type ZetroProject = {
  archived: boolean
  createdAt: string
  id: string
  name: string
  repositoryPath: string
  updatedAt: string
}

export type ProjectUpdate = {
  archived?: boolean
  name?: string
}
