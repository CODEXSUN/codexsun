import type { ProductModuleId } from '../domain/module-registry'

export interface NavigationSection {
  title: string
  moduleIds: ProductModuleId[]
}

export const navigationSections: NavigationSection[] = [
  {
    title: 'Foundation',
    moduleIds: ['organization', 'masters', 'audit'],
  },
  {
    title: 'Transactions',
    moduleIds: ['sales', 'purchases', 'payments', 'inventory', 'tax'],
  },
  {
    title: 'Growth',
    moduleIds: ['crm', 'commerce', 'reports'],
  },
]
