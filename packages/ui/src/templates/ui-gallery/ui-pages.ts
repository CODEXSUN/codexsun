import { designSystemPages, type DesignSystemPageDefinition } from '../../design-system'

export type UiPageId =
  'forgot-password' | 'login-v1' | 'login-v2' | 'notifications' | 'register-v1' | 'register-v2'

export type UiPageDoc = {
  family: DesignSystemPageDefinition
  id: UiPageId
  name: string
  variantId: string
}

export const uiPageDocs: readonly UiPageDoc[] = [
  createPage('login', 'v1', 'login-v1'),
  createPage('login', 'v2', 'login-v2'),
  createPage('register', 'v1', 'register-v1'),
  createPage('register', 'v2', 'register-v2'),
  createPage('forgot-password', 'default', 'forgot-password'),
  createPage('notifications', 'default', 'notifications'),
]

export function findUiPage(pageId: string | null) {
  return uiPageDocs.find(({ id }) => id === pageId)
}

function createPage(familyId: string, variantId: string, id: UiPageId): UiPageDoc {
  const family = designSystemPages.find((page) => page.id === familyId)
  const variant = family?.variants.find((item) => item.id === variantId)
  if (!family || !variant) throw new Error(`Unknown UI page: ${familyId}.${variantId}`)
  return { family, id, name: variant.name, variantId }
}
