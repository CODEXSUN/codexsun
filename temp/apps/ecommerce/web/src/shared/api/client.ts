import type {
  AuthAccountRecoveryRequestPayload,
  AuthAccountRecoveryRequestResponse,
  AuthAccountRecoveryRestorePayload,
  AuthAccountRecoveryRestoreResponse,
  AuthLoginPayload,
  AuthChangePasswordPayload,
  AuthChangePasswordResponse,
  AuthDeleteAccountPayload,
  AuthDeleteAccountResponse,
  AuthPasswordResetConfirmPayload,
  AuthPasswordResetConfirmResponse,
  AuthPasswordResetRequestPayload,
  AuthPasswordResetRequestResponse,
  AuthRegisterPayload,
  AuthRegisterOtpRequestPayload,
  AuthRegisterOtpRequestResponse,
  AuthRegisterOtpVerifyPayload,
  AuthRegisterOtpVerifyResponse,
  AuthTokenResponse,
  AuthUserListResponse,
  AuthUserResponse,
  AuthUserUpsertPayload,
  AuthUser,
  CustomerProfileResponse,
  CustomerProfileUpdatePayload,
  CustomerHelpdeskDetailResponse,
  CustomerHelpdeskListResponse,
  CompanyListResponse,
  CompanyResponse,
  CompanyUpsertPayload,
  ContactListResponse,
  ContactResponse,
  ContactUpsertPayload,
  MediaFolderListResponse,
  MediaFolderResponse,
  MediaFolderUpsertPayload,
  MediaImageUploadPayload,
  MediaListResponse,
  MediaResponse,
  MediaUpsertPayload,
  ProductListResponse,
  ProductResponse,
  ProductUpsertPayload,
  CommerceOrderListResponse,
  CommerceOrderWorkflowResponse,
  CommerceWorkflowActionPayload,
  PrintableDocumentResponse,
  MailboxMessageListResponse,
  MailboxMessageResponse,
  MailboxSendPayload,
  MailboxTemplateListResponse,
  MailboxTemplateResponse,
  MailboxTemplateUpsertPayload,
  MilestoneListResponse,
  MilestoneResponse,
  MilestoneUpsertPayload,
  NotificationListResponse,
  StorefrontCatalogResponse,
  StorefrontCheckoutPayload,
  StorefrontCheckoutResponse,
  StorefrontCheckoutSessionResponse,
  StorefrontOrderListResponse,
  StorefrontPaymentVerificationPayload,
  CommonModuleKey,
  CommonModuleListResponse,
  CommonModuleMetadata,
  CommonModuleMetadataListResponse,
  CommonModuleRecordResponse,
  CommonModuleUpsertPayload,
  DatabaseBackupDeleteResponse,
  DatabaseBackupResponse,
  DatabaseBackupUploadPayload,
  DatabaseBackupUploadResponse,
  DatabaseHardResetPayload,
  DatabaseManagerActionResponse,
  DatabaseManagerResponse,
  DatabaseRestorePayload,
  DatabaseRestoreResponse,
  DatabaseSetupPayload,
  FrappeConnectionVerificationResponse,
  FrappeItemManagerResponse,
  FrappeItemProductSyncPayload,
  FrappeItemProductSyncLogManagerResponse,
  FrappeItemProductSyncResponse,
  FrappeItemResponse,
  FrappeItemUpsertPayload,
  FrappePurchaseReceiptManagerResponse,
  FrappePurchaseReceiptResponse,
  FrappePurchaseReceiptSyncPayload,
  FrappePurchaseReceiptSyncResponse,
  FrappeSettingsResponse,
  FrappeSettingsUpdatePayload,
  FrappeTodoListResponse,
  FrappeTodoResponse,
  FrappeTodoUpsertPayload,
  SetupStatusResponse,
  SystemSettingsResponse,
  SystemSettingsUpdatePayload,
  SystemEnvironmentResponse,
  SystemEnvironmentUpdatePayload,
  EcommercePricingSettingsResponse,
  EcommercePricingSettingsUpdatePayload,
  SystemUpdateRunResponse,
  SystemVersionResponse,
  SystemUpdateCheckResponse,
  SupportAssistantChatRequestPayload,
  SupportAssistantChatResponse,
  SupportAssistantStatusResponse,
  TaskBulkCreateResponse,
  TaskAuditListResponse,
  TaskActivityInput,
  TaskGroupListResponse,
  TaskGroupResponse,
  TaskGroupUpsertPayload,
  TaskInsightsResponse,
  TaskListResponse,
  TaskResponse,
  TaskTemplateListResponse,
  TaskTemplateResponse,
  TaskTemplateUpsertPayload,
  TaskUpsertPayload,
} from '@shared/index'

const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
const defaultLocalApiBaseUrl = 'http://127.0.0.1:4000'

function isViteLocalDevOrigin(origin: string) {
  try {
    const url = new URL(origin)
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      url.port === '5173'
    )
  } catch {
    return false
  }
}

function resolveApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    if (isViteLocalDevOrigin(window.location.origin)) {
      return defaultLocalApiBaseUrl
    }

    return window.location.origin
  }

  return defaultLocalApiBaseUrl
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly context?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string; context?: unknown }
    | null

  if (!response.ok) {
    const context = payload && typeof payload === 'object' && 'context' in payload ? payload.context : undefined
    const detail =
      context
      && typeof context === 'object'
      && 'detail' in context
      && typeof (context as { detail?: unknown }).detail === 'string'
        ? String((context as { detail?: unknown }).detail)
        : undefined
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? (payload.error === 'Unhandled server error.' && detail ? detail : payload.error)
        : 'Request failed.'
    throw new HttpError(message, response.status, context)
  }

  return payload as T
}

export async function requestText(path: string, init?: RequestInit) {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  })

  const body = await response.text()

  if (!response.ok) {
    throw new HttpError(body || 'Request failed.', response.status)
  }

  return body
}

function createAuthorizationHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
  }
}

async function downloadAuthorizedFile(token: string, path: string, suggestedFileName?: string) {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    headers: createAuthorizationHeaders(token),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; context?: unknown } | null
    throw new HttpError(payload?.error ?? 'Request failed.', response.status, payload?.context)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fileName = suggestedFileName
    ?? response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1]
    ?? 'download'

  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

export async function fetchSetupStatus() {
  const response = await request<SetupStatusResponse>('/setup/status')
  return response.status
}

export async function saveDatabaseSetup(payload: DatabaseSetupPayload) {
  const response = await request<SetupStatusResponse>('/setup/database', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.status
}

export function login(payload: AuthLoginPayload) {
  return request<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function recoveryLogin(payload: AuthLoginPayload) {
  return request<AuthTokenResponse>('/auth/recovery-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload: AuthRegisterPayload) {
  return request<AuthTokenResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestRegisterOtp(payload: AuthRegisterOtpRequestPayload) {
  return request<AuthRegisterOtpRequestResponse>('/auth/register/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyRegisterOtp(payload: AuthRegisterOtpVerifyPayload) {
  return request<AuthRegisterOtpVerifyResponse>('/auth/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestAccountRecoveryOtp(payload: AuthAccountRecoveryRequestPayload) {
  return request<AuthAccountRecoveryRequestResponse>('/auth/account-recovery/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestPasswordResetOtp(payload: AuthPasswordResetRequestPayload) {
  return request<AuthPasswordResetRequestResponse>('/auth/password-reset/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmPasswordReset(payload: AuthPasswordResetConfirmPayload) {
  return request<AuthPasswordResetConfirmResponse>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function restoreAccount(payload: AuthAccountRecoveryRestorePayload) {
  return request<AuthAccountRecoveryRestoreResponse>('/auth/account-recovery/restore', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(token: string) {
  return request<AuthUser>('/auth/me', {
    headers: createAuthorizationHeaders(token),
  })
}

export async function listUsers(token: string) {
  const response = await request<AuthUserListResponse>('/admin/users', {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getUser(token: string, id: string) {
  const response = await request<AuthUserResponse>(`/admin/users/${id}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createUser(token: string, payload: AuthUserUpsertPayload) {
  const response = await request<AuthUserResponse>('/admin/users', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateUser(token: string, id: string, payload: AuthUserUpsertPayload) {
  const response = await request<AuthUserResponse>(`/admin/users/${id}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateUser(token: string, id: string) {
  const response = await request<AuthUserResponse>(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function restoreUser(token: string, id: string) {
  const response = await request<AuthUserResponse>(`/admin/users/${id}/restore`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export function changeCustomerPassword(token: string, payload: AuthChangePasswordPayload) {
  return request<AuthChangePasswordResponse>('/customer/account/change-password', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function deleteCustomerAccount(token: string, payload: AuthDeleteAccountPayload) {
  return request<AuthDeleteAccountResponse>('/customer/account', {
    method: 'DELETE',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export async function getCustomerProfile(token: string) {
  const response = await request<CustomerProfileResponse>('/customer/profile', {
    headers: createAuthorizationHeaders(token),
  })
  return response.profile
}

export async function updateCustomerProfile(token: string, payload: CustomerProfileUpdatePayload) {
  const response = await request<CustomerProfileResponse>('/customer/profile', {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.profile
}

export async function getSystemSettings(token: string) {
  const response = await request<SystemSettingsResponse>('/admin/settings/system', {
    headers: createAuthorizationHeaders(token),
  })
  return response.settings
}

export async function updateSystemSettings(token: string, payload: SystemSettingsUpdatePayload) {
  const response = await request<SystemSettingsResponse>('/admin/settings/system', {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.settings
}

export async function getEcommerceSettings(token: string) {
  const response = await request<EcommercePricingSettingsResponse>('/admin/ecommerce/settings', {
    headers: createAuthorizationHeaders(token),
  })
  return response.settings
}

export async function updateEcommerceSettings(token: string, payload: EcommercePricingSettingsUpdatePayload) {
  const response = await request<EcommercePricingSettingsResponse>('/admin/ecommerce/settings', {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.settings
}

export async function getSystemEnvironment(token: string) {
  const response = await request<SystemEnvironmentResponse>('/admin/settings/environment', {
    headers: createAuthorizationHeaders(token),
  })
  return response.environment
}

export async function getFrappeSettings(token: string) {
  const response = await request<FrappeSettingsResponse>('/admin/frappe/settings', {
    headers: createAuthorizationHeaders(token),
  })
  return response.settings
}

export async function updateFrappeSettings(token: string, payload: FrappeSettingsUpdatePayload) {
  const response = await request<FrappeSettingsResponse>('/admin/frappe/settings', {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.settings
}

export async function verifyFrappeConnection(token: string, payload: FrappeSettingsUpdatePayload) {
  const response = await request<FrappeConnectionVerificationResponse>('/admin/frappe/settings/verify', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.verification
}

export async function listFrappeTodos(token: string) {
  const response = await request<FrappeTodoListResponse>('/admin/frappe/todos', {
    headers: createAuthorizationHeaders(token),
  })
  return response.todos
}

export async function listFrappeItems(token: string) {
  const response = await request<FrappeItemManagerResponse>('/admin/frappe/items', {
    headers: createAuthorizationHeaders(token),
  })
  return response.manager
}

export async function listFrappeItemProductSyncLogs(token: string) {
  const response = await request<FrappeItemProductSyncLogManagerResponse>('/admin/frappe/items/sync-logs', {
    headers: createAuthorizationHeaders(token),
  })
  return response.manager
}

export async function getFrappeItem(token: string, itemId: string) {
  const response = await request<FrappeItemResponse>(`/admin/frappe/items/${encodeURIComponent(itemId)}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createFrappeItem(token: string, payload: FrappeItemUpsertPayload) {
  const response = await request<FrappeItemResponse>('/admin/frappe/items', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateFrappeItem(token: string, itemId: string, payload: FrappeItemUpsertPayload) {
  const response = await request<FrappeItemResponse>(`/admin/frappe/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function syncFrappeItemsToProducts(token: string, payload: FrappeItemProductSyncPayload) {
  const response = await request<FrappeItemProductSyncResponse>('/admin/frappe/items/sync-products', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.sync
}

export async function listFrappePurchaseReceipts(token: string) {
  const response = await request<FrappePurchaseReceiptManagerResponse>('/admin/frappe/purchase-receipts', {
    headers: createAuthorizationHeaders(token),
  })
  return response.manager
}

export async function getFrappePurchaseReceipt(token: string, receiptId: string) {
  const response = await request<FrappePurchaseReceiptResponse>(`/admin/frappe/purchase-receipts/${encodeURIComponent(receiptId)}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function syncFrappePurchaseReceipts(token: string, payload: FrappePurchaseReceiptSyncPayload) {
  const response = await request<FrappePurchaseReceiptSyncResponse>('/admin/frappe/purchase-receipts/sync', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.sync
}

export async function createFrappeTodo(token: string, payload: FrappeTodoUpsertPayload) {
  const response = await request<FrappeTodoResponse>('/admin/frappe/todos', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateFrappeTodo(token: string, todoId: string, payload: FrappeTodoUpsertPayload) {
  const response = await request<FrappeTodoResponse>(`/admin/frappe/todos/${encodeURIComponent(todoId)}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateSystemEnvironment(token: string, payload: SystemEnvironmentUpdatePayload) {
  const response = await request<SystemEnvironmentResponse>('/admin/settings/environment', {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.environment
}

export async function runSystemUpdate(token: string, payload: SystemSettingsUpdatePayload) {
  return request<SystemUpdateRunResponse>('/admin/settings/system/update', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export async function runSystemEnvironmentUpdate(token: string, payload: SystemEnvironmentUpdatePayload) {
  return request<SystemUpdateRunResponse>('/admin/settings/environment/update', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export async function getSystemVersion() {
  const response = await request<SystemVersionResponse>('/system/version')
  return response.version
}

export async function getSupportAssistantStatus() {
  const response = await request<SupportAssistantStatusResponse>('/support/assistant/status')
  return response.assistant
}

export async function askSupportAssistant(payload: SupportAssistantChatRequestPayload) {
  return request<SupportAssistantChatResponse>('/support/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reindexSupportAssistant(token: string) {
  const response = await request<SupportAssistantStatusResponse>('/admin/support/assistant/reindex', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
  return response.assistant
}

export async function getSystemUpdateCheck(token: string) {
  const response = await request<SystemUpdateCheckResponse>('/admin/system/update-check', {
    headers: createAuthorizationHeaders(token),
  })
  return response.update
}

export async function getDatabaseManager(token: string) {
  const response = await request<DatabaseManagerResponse>('/admin/database-manager', {
    headers: createAuthorizationHeaders(token),
  })
  return response.report
}

export function verifyDatabaseManager(token: string) {
  return request<DatabaseManagerActionResponse>('/admin/database-manager/verify', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export function migrateDatabaseManager(token: string) {
  return request<DatabaseManagerActionResponse>('/admin/database-manager/migrate', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export function backupDatabaseManager(token: string) {
  return request<DatabaseBackupResponse>('/admin/database-manager/backup', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export function uploadDatabaseManagerBackup(token: string, payload: DatabaseBackupUploadPayload) {
  return request<DatabaseBackupUploadResponse>('/admin/database-manager/backups/upload', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function deleteDatabaseManagerBackup(token: string, fileName: string) {
  return request<DatabaseBackupDeleteResponse>(`/admin/database-manager/backups/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: createAuthorizationHeaders(token),
  })
}

export function hardResetDatabaseManager(token: string, payload: DatabaseHardResetPayload) {
  return request<DatabaseManagerActionResponse>('/admin/database-manager/hard-reset', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function restoreDatabaseManager(token: string, payload: DatabaseRestorePayload) {
  return request<DatabaseRestoreResponse>('/admin/database-manager/restore', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function getRestoreDatabaseManagerJob(token: string, jobId: string) {
  return request<DatabaseRestoreResponse>(`/admin/database-manager/restore/jobs/${encodeURIComponent(jobId)}`, {
    headers: createAuthorizationHeaders(token),
  })
}

export async function downloadDatabaseManagerBackup(token: string, downloadPath: string, fileName?: string) {
  await downloadAuthorizedFile(token, downloadPath, fileName)
}

export async function listCommonModuleMetadata() {
  const response = await request<CommonModuleMetadataListResponse>('/common/modules')
  return response.modules
}

export async function getCommonModuleMetadata(moduleKey: CommonModuleKey) {
  const response = await request<{ module: CommonModuleMetadata }>(`/common/modules/${moduleKey}`)
  return response.module
}

export async function listCommonModuleItems(moduleKey: CommonModuleKey, includeInactive = true) {
  const response = await request<CommonModuleListResponse>(
    `/common/${moduleKey}?includeInactive=${includeInactive ? 'true' : 'false'}`,
  )
  return response.items
}

export async function getCommonModuleItem(moduleKey: CommonModuleKey, id: string) {
  const response = await request<CommonModuleRecordResponse>(`/common/${moduleKey}/${id}`)
  return response.item
}

export async function createCommonModuleItem(
  moduleKey: CommonModuleKey,
  payload: CommonModuleUpsertPayload,
) {
  const response = await request<CommonModuleRecordResponse>(`/common/${moduleKey}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateCommonModuleItem(
  moduleKey: CommonModuleKey,
  id: string,
  payload: CommonModuleUpsertPayload,
) {
  const response = await request<CommonModuleRecordResponse>(`/common/${moduleKey}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateCommonModuleItem(moduleKey: CommonModuleKey, id: string) {
  await request<CommonModuleRecordResponse>(`/common/${moduleKey}/${id}`, {
    method: 'DELETE',
  })
}

export async function restoreCommonModuleItem(moduleKey: CommonModuleKey, id: string) {
  await request<CommonModuleRecordResponse>(`/common/${moduleKey}/${id}/restore`, {
    method: 'POST',
  })
}

export async function listCompanies() {
  const response = await request<CompanyListResponse>('/companies')
  return response.items
}

export async function getCompany(id: string) {
  const response = await request<CompanyResponse>(`/companies/${id}`)
  return response.item
}

export async function createCompany(payload: CompanyUpsertPayload) {
  const response = await request<CompanyResponse>('/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateCompany(id: string, payload: CompanyUpsertPayload) {
  const response = await request<CompanyResponse>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateCompany(id: string) {
  const response = await request<CompanyResponse>(`/companies/${id}`, {
    method: 'DELETE',
  })
  return response.item
}

export async function restoreCompany(id: string) {
  const response = await request<CompanyResponse>(`/companies/${id}/restore`, {
    method: 'POST',
  })
  return response.item
}

export async function listContacts() {
  const response = await request<ContactListResponse>('/contacts')
  return response.items
}

export async function getContact(id: string) {
  const response = await request<ContactResponse>(`/contacts/${id}`)
  return response.item
}

export async function createContact(payload: ContactUpsertPayload) {
  const response = await request<ContactResponse>('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateContact(id: string, payload: ContactUpsertPayload) {
  const response = await request<ContactResponse>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateContact(id: string) {
  const response = await request<ContactResponse>(`/contacts/${id}`, { method: 'DELETE' })
  return response.item
}

export async function restoreContact(id: string) {
  const response = await request<ContactResponse>(`/contacts/${id}/restore`, { method: 'POST' })
  return response.item
}

export async function listProducts() {
  const response = await request<ProductListResponse>('/products')
  return response.items
}

export async function getProduct(id: string) {
  const response = await request<ProductResponse>(`/products/${id}`)
  return response.item
}

export async function createProduct(payload: ProductUpsertPayload) {
  const response = await request<ProductResponse>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateProduct(id: string, payload: ProductUpsertPayload) {
  const response = await request<ProductResponse>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateProduct(id: string) {
  const response = await request<ProductResponse>(`/products/${id}`, { method: 'DELETE' })
  return response.item
}

export async function restoreProduct(id: string) {
  const response = await request<ProductResponse>(`/products/${id}/restore`, { method: 'POST' })
  return response.item
}

export async function listMailboxMessages() {
  const response = await request<MailboxMessageListResponse>('/mailbox/messages')
  return response.items
}

export async function getMailboxMessage(id: string) {
  const response = await request<MailboxMessageResponse>(`/mailbox/messages/${id}`)
  return response.item
}

export async function sendMailboxMessage(payload: MailboxSendPayload) {
  const response = await request<MailboxMessageResponse>('/mailbox/messages/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function listMailboxTemplates(includeInactive = true) {
  const response = await request<MailboxTemplateListResponse>(`/mailbox/templates?includeInactive=${includeInactive ? 'true' : 'false'}`)
  return response.items
}

export async function getMailboxTemplate(id: string) {
  const response = await request<MailboxTemplateResponse>(`/mailbox/templates/${id}`)
  return response.item
}

export async function createMailboxTemplate(payload: MailboxTemplateUpsertPayload) {
  const response = await request<MailboxTemplateResponse>('/mailbox/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateMailboxTemplate(id: string, payload: MailboxTemplateUpsertPayload) {
  const response = await request<MailboxTemplateResponse>(`/mailbox/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateMailboxTemplate(id: string) {
  const response = await request<MailboxTemplateResponse>(`/mailbox/templates/${id}`, {
    method: 'DELETE',
  })
  return response.item
}

export async function restoreMailboxTemplate(id: string) {
  const response = await request<MailboxTemplateResponse>(`/mailbox/templates/${id}/restore`, {
    method: 'POST',
  })
  return response.item
}

export function getStorefrontCatalog() {
  return request<StorefrontCatalogResponse>('/storefront/catalog')
}

export async function createStorefrontCheckout(payload: StorefrontCheckoutPayload) {
  const response = await request<StorefrontCheckoutSessionResponse>('/storefront/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response
}

export async function verifyStorefrontPayment(payload: StorefrontPaymentVerificationPayload) {
  const response = await request<StorefrontCheckoutResponse>('/storefront/checkout/verify-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.order
}

export async function listCustomerOrders(token: string) {
  const response = await request<StorefrontOrderListResponse>('/customer/orders', {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function listTasks(token: string, filters?: {
  milestoneId?: string
}) {
  const searchParams = new URLSearchParams()
  if (filters?.milestoneId) searchParams.set('milestoneId', filters.milestoneId)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const response = await request<TaskListResponse>(`/tasks${suffix}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function listMilestones(token: string, filters?: {
  status?: string
  entityType?: string
  entityId?: string
}) {
  const searchParams = new URLSearchParams()
  if (filters?.status) searchParams.set('status', filters.status)
  if (filters?.entityType) searchParams.set('entityType', filters.entityType)
  if (filters?.entityId) searchParams.set('entityId', filters.entityId)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const response = await request<MilestoneListResponse>(`/milestones${suffix}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getMilestone(token: string, id: string) {
  const response = await request<MilestoneResponse>(`/milestones/${id}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createMilestone(token: string, payload: MilestoneUpsertPayload) {
  const response = await request<MilestoneResponse>('/milestones', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateMilestone(token: string, id: string, payload: MilestoneUpsertPayload) {
  const response = await request<MilestoneResponse>(`/milestones/${id}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function listTaskGroups(token: string, filters?: {
  status?: string
  type?: string
}) {
  const searchParams = new URLSearchParams()
  if (filters?.status) searchParams.set('status', filters.status)
  if (filters?.type) searchParams.set('type', filters.type)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const response = await request<TaskGroupListResponse>(`/task-groups${suffix}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getTaskGroup(token: string, id: string) {
  const response = await request<TaskGroupResponse>(`/task-groups/${id}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createTaskGroup(token: string, payload: TaskGroupUpsertPayload) {
  const response = await request<TaskGroupResponse>('/task-groups', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateTaskGroup(token: string, id: string, payload: TaskGroupUpsertPayload) {
  const response = await request<TaskGroupResponse>(`/task-groups/${id}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function listTasksByEntity(token: string, entityType: string, entityId: string) {
  const response = await request<TaskListResponse>(`/tasks?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getTask(token: string, id: string) {
  const response = await request<TaskResponse>(`/tasks/${id}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createTask(token: string, payload: TaskUpsertPayload) {
  const response = await request<TaskResponse>('/tasks', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateTask(token: string, id: string, payload: TaskUpsertPayload) {
  const response = await request<TaskResponse>(`/tasks/${id}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function addTaskActivity(token: string, id: string, payload: TaskActivityInput) {
  const response = await request<TaskResponse>(`/tasks/${id}/activities`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function listTaskTemplates(token: string, scopeType?: string) {
  const suffix = scopeType ? `?scopeType=${encodeURIComponent(scopeType)}` : ''
  const response = await request<TaskTemplateListResponse>(`/task-templates${suffix}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getTaskTemplate(token: string, id: string) {
  const response = await request<TaskTemplateResponse>(`/task-templates/${id}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export async function createTaskTemplate(token: string, payload: TaskTemplateUpsertPayload) {
  const response = await request<TaskTemplateResponse>('/task-templates', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateTaskTemplate(token: string, id: string, payload: TaskTemplateUpsertPayload) {
  const response = await request<TaskTemplateResponse>(`/task-templates/${id}`, {
    method: 'PATCH',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function createTaskFromTemplate(token: string, payload: {
  templateId: string
  taskGroupId?: string | null
  milestoneId?: string | null
  assigneeId?: string | null
  dueDate?: string | null
  entityType?: string | null
  entityId?: string | null
  entityLabel?: string | null
  title?: string | null
  description?: string | null
  tags?: string[]
  priority?: string
}) {
  const response = await request<TaskResponse>('/tasks/from-template', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function createTasksFromTemplateBulk(token: string, payload: {
  templateId: string
  milestoneId: string
  taskGroupId?: string | null
  entityType: string
  entityIds: string[]
  assigneeMode?: 'specific' | 'self' | 'unassigned'
  assigneeId?: string | null
  dueDate?: string | null
  tags?: string[]
  priority?: string
}) {
  const response = await request<TaskBulkCreateResponse>('/tasks/from-template/bulk', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response
}

export async function getTaskInsights(token: string) {
  const response = await request<TaskInsightsResponse>('/tasks/insights', {
    headers: createAuthorizationHeaders(token),
  })
  return response.insights
}

export async function getTaskAuditList(token: string, filters?: {
  templateId?: string
  assigneeId?: string
  status?: string
  verificationState?: string
  dateFrom?: string
  dateTo?: string
}) {
  const searchParams = new URLSearchParams()
  if (filters?.templateId) searchParams.set('templateId', filters.templateId)
  if (filters?.assigneeId) searchParams.set('assigneeId', filters.assigneeId)
  if (filters?.status) searchParams.set('status', filters.status)
  if (filters?.verificationState) searchParams.set('verificationState', filters.verificationState)
  if (filters?.dateFrom) searchParams.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) searchParams.set('dateTo', filters.dateTo)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const response = await request<TaskAuditListResponse>(`/tasks/audit${suffix}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function listNotifications(token: string) {
  return request<NotificationListResponse>('/notifications', {
    headers: createAuthorizationHeaders(token),
  })
}

export async function markNotificationRead(token: string, notificationId: string) {
  return request<NotificationListResponse>(`/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export async function markAllNotificationsRead(token: string) {
  return request<NotificationListResponse>('/notifications/read-all', {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export async function markNotificationsReadByTask(token: string, taskId: string) {
  return request<NotificationListResponse>(`/notifications/tasks/${encodeURIComponent(taskId)}/read`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export async function getCustomerOrderWorkflow(token: string, orderId: string) {
  const response = await request<CommerceOrderWorkflowResponse>(`/customer/orders/${orderId}/workflow`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.workflow
}

export async function listCommerceOrders(token: string) {
  const response = await request<CommerceOrderListResponse>('/admin/commerce/orders', {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function listCustomerHelpdeskCustomers(token: string) {
  const response = await request<CustomerHelpdeskListResponse>('/admin/customers/helpdesk', {
    headers: createAuthorizationHeaders(token),
  })
  return response.items
}

export async function getCustomerHelpdeskCustomer(token: string, customerId: string) {
  const response = await request<CustomerHelpdeskDetailResponse>(`/admin/customers/helpdesk/${customerId}`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.item
}

export function sendCustomerHelpdeskPasswordReset(token: string, customerId: string) {
  return request<AuthPasswordResetRequestResponse>(`/admin/customers/helpdesk/${customerId}/password-reset/request`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export function sendCustomerHelpdeskRecoveryEmail(token: string, customerId: string) {
  return request<AuthAccountRecoveryRequestResponse>(`/admin/customers/helpdesk/${customerId}/account-recovery/request`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
  })
}

export async function getCommerceOrderWorkflow(token: string, orderId: string) {
  const response = await request<CommerceOrderWorkflowResponse>(`/admin/commerce/orders/${orderId}/workflow`, {
    headers: createAuthorizationHeaders(token),
  })
  return response.workflow
}

export async function applyCommerceWorkflowAction(
  token: string,
  orderId: string,
  payload: CommerceWorkflowActionPayload,
) {
  const response = await request<CommerceOrderWorkflowResponse>(`/admin/commerce/orders/${orderId}/workflow`, {
    method: 'POST',
    headers: createAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })
  return response.workflow
}

export async function getCommerceInvoicePrint(token: string, orderId: string) {
  const html = await requestText(`/admin/commerce/orders/${orderId}/invoice/print`, {
    headers: createAuthorizationHeaders(token),
  })

  return {
    fileName: `${orderId}.html`,
    mediaType: 'text/html',
    html,
  } satisfies PrintableDocumentResponse
}

export async function listMedia() {
  const response = await request<MediaListResponse>('/media')
  return response.items
}

export async function getMedia(id: string) {
  const response = await request<MediaResponse>(`/media/${id}`)
  return response.item
}

export async function createMedia(payload: MediaUpsertPayload) {
  const response = await request<MediaResponse>('/media', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function uploadMediaImage(payload: MediaImageUploadPayload) {
  const response = await request<MediaResponse>('/media/upload-image', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateMedia(id: string, payload: MediaUpsertPayload) {
  const response = await request<MediaResponse>(`/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateMedia(id: string) {
  await request<MediaResponse>(`/media/${id}`, { method: 'DELETE' })
}

export async function restoreMedia(id: string) {
  await request<MediaResponse>(`/media/${id}/restore`, { method: 'POST' })
}

export async function listMediaFolders() {
  const response = await request<MediaFolderListResponse>('/media/folders')
  return response.items
}

export async function createMediaFolder(payload: MediaFolderUpsertPayload) {
  const response = await request<MediaFolderResponse>('/media/folders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function updateMediaFolder(id: string, payload: MediaFolderUpsertPayload) {
  const response = await request<MediaFolderResponse>(`/media/folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.item
}

export async function deactivateMediaFolder(id: string) {
  await request<MediaFolderResponse>(`/media/folders/${id}`, { method: 'DELETE' })
}

export async function restoreMediaFolder(id: string) {
  await request<MediaFolderResponse>(`/media/folders/${id}/restore`, { method: 'POST' })
}
