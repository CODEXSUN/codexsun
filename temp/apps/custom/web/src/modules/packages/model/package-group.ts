import type { PackageItem } from '@custom-domain/models/package-item'

export interface PackageGroup {
  title: string
  items: PackageItem[]
}
