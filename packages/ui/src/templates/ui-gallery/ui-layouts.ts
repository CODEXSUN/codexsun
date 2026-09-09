export type UiLayoutId = 'mdi-main'

export type UiLayoutDoc = {
  code: string
  description: string
  id: UiLayoutId
  name: string
  packageName: string
  summary: string
}

export const uiLayoutDocs: readonly UiLayoutDoc[] = [
  {
    id: 'mdi-main',
    name: 'MDI Main',
    packageName: '@codexsun/ui/layouts/mdi-main',
    summary: 'Application shell with a command bar, navigation rail, canvas, and status surface.',
    description:
      'Use MDI Main as the shared application base. Applications provide identity, navigation, workspace content, and feature data through public properties.',
    code: `import { LayoutDashboardIcon, ReceiptTextIcon } from 'lucide-react'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'

const navigation = [
  {
    defaultOpen: true,
    label: 'Billing',
    items: [
      { active: true, icon: ReceiptTextIcon, label: 'Invoices' },
      { icon: ReceiptTextIcon, label: 'Payments' },
    ],
  },
]

export function ApplicationShell() {
  return (
    <MdiMain
      applicationId="accounts"
      applicationName="Accounts"
      navigation={navigation}
      notificationCount={2}
      primaryAction={{ icon: LayoutDashboardIcon, label: 'Overview' }}
      searchPlaceholder="Search accounts"
      statusLabel="Ready"
      workspaceTitle="Overview"
    >
      <AccountsOverview />
    </MdiMain>
  )
}`,
  },
]

export function findUiLayout(layoutId: string | null): UiLayoutDoc | undefined {
  return uiLayoutDocs.find(({ id }) => id === layoutId)
}
