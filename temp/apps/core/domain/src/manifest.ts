export interface CoreWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const coreWorkspaceItems: CoreWorkspaceItem[] = [
  {
    id: 'overview',
    name: 'Core Overview',
    route: '/admin/dashboard/core',
    summary: 'Shared organization, master-data, and admin operating surface.',
  },
  {
    id: 'companies',
    name: 'Companies',
    route: '/admin/dashboard/companies',
    summary: 'Company-level setup and organization records.',
  },
  {
    id: 'contacts',
    name: 'Contacts',
    route: '/admin/dashboard/contacts',
    summary: 'Shared contact and party management.',
  },
  {
    id: 'media',
    name: 'Media',
    route: '/admin/dashboard/media',
    summary: 'Shared storage-backed media and file management.',
  },
  {
    id: 'common-modules',
    name: 'Common Modules',
    route: '/admin/dashboard/common',
    summary: 'Geography and reusable master data shared across apps.',
  },
  {
    id: 'core-settings',
    name: 'Core Settings',
    route: '/admin/dashboard/core/settings',
    summary: 'Core app defaults, operational guardrails, and shared foundation configuration.',
  },
]
