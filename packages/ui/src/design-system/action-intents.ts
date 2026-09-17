import { buttonDefaultVariant } from './defaults'

export const actionVariantByIntent = {
  alternative: 'secondary',
  caution: 'warning',
  destructive: 'destructive',
  information: 'info',
  navigation: 'link',
  neutral: 'neutral',
  positive: 'success',
  primary: buttonDefaultVariant,
  quiet: 'ghost',
  surface: 'outline',
} as const

export type ActionIntent = keyof typeof actionVariantByIntent
export type ActionVariant = (typeof actionVariantByIntent)[ActionIntent]

export function resolveActionVariant(intent: ActionIntent): ActionVariant {
  return actionVariantByIntent[intent]
}
