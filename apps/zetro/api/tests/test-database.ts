import { ZetroDatabase } from '../src/infrastructure/zetro-database.js'

export function openTestDatabase(_directory: string): Promise<ZetroDatabase> {
  void _directory
  return ZetroDatabase.openSqlite(':memory:')
}
