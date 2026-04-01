import { toast } from 'sonner'

type SaveToastOptions = {
  entityLabel: string
  recordName: string
  referenceId: string
  mode?: 'create' | 'update'
}

type BasicToastOptions = {
  title: string
  description: string
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toReference(referenceId: string) {
  return `#${referenceId.slice(-4).toUpperCase()}`
}

export function showSuccessToast({ title, description }: BasicToastOptions) {
  toast.success(title, { description })
}

export function showErrorToast({ title, description }: BasicToastOptions) {
  toast.error(title, { description })
}

export function showWarningToast({ title, description }: BasicToastOptions) {
  toast.warning(title, { description })
}

export function showInfoToast({ title, description }: BasicToastOptions) {
  toast.info(title, { description })
}

type FailedActionToastOptions = {
  entityLabel: string
  action: string
  detail: string
}

type StatusChangeToastOptions = {
  entityLabel: string
  recordName: string
  referenceId: string
  action: 'deactivate' | 'restore'
}

export function showFailedActionToast({
  entityLabel,
  action,
  detail,
}: FailedActionToastOptions) {
  showErrorToast({
    title: `Unable to ${action} ${entityLabel}`,
    description: detail,
  })
}

export function showValidationToast(entityLabel: string) {
  showWarningToast({
    title: `${capitalize(entityLabel)} not saved`,
    description: 'Review the required fields and try again.',
  })
}

export function showStatusChangeToast({
  entityLabel,
  recordName,
  referenceId,
  action,
}: StatusChangeToastOptions) {
  showSuccessToast({
    title: action === 'deactivate' ? `${capitalize(entityLabel)} deactivated` : `${capitalize(entityLabel)} restored`,
    description: `${capitalize(entityLabel)} "${recordName}" is now ${action === 'deactivate' ? 'inactive' : 'active'}. Ref ${toReference(referenceId)}.`,
  })
}

export function showSavedToast({
  entityLabel,
  recordName,
  referenceId,
  mode = 'create',
}: SaveToastOptions) {
  const actionText = mode === 'update' ? 'updated' : 'saved'
  const title = mode === 'update' ? 'Changes saved' : 'Saved successfully'

  showSuccessToast({
    title,
    description: `${capitalize(entityLabel)} "${recordName}" is ${actionText}. Ref ${toReference(referenceId)}.`,
  })
}
