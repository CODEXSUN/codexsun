import type { DatabaseOrm } from '../orm'

export interface SeederContext {
  db: DatabaseOrm
}

export interface Seeder {
  id: string
  name: string
  isEnabled?: () => boolean
  run: (context: SeederContext) => Promise<void>
}
