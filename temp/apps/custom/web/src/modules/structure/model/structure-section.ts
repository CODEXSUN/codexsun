import type { RootFolder } from '@custom-domain/models/root-folder'

export interface StructureSection {
  title: string
  description: string
  items: RootFolder[]
}
