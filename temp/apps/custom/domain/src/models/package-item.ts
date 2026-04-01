export interface PackageItem {
  name: string
  kind: 'runtime' | 'dev'
  reason: string
}
