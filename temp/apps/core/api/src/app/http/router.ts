import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { ZodError } from 'zod'
import type { CommonModuleKey } from '@shared/index'
import { getFrameworkManifest } from '@framework-core/manifest'
import { AuthService } from '@framework-core/auth/application/auth-service'
import { AuthUserRepository } from '@framework-core/auth/data/auth-user-repository'
import { MailboxService } from '@framework-core/mailbox/application/mailbox-service'
import { MailboxRepository } from '@framework-core/mailbox/data/mailbox-repository'
import { CommonModuleService } from '../../features/common-modules/application/common-module-service'
import { CommonModuleRepository } from '../../features/common-modules/data/common-module-repository'
import { CompanyService } from '../../features/company/application/company-service'
import { CompanyRepository } from '../../features/company/data/company-repository'
import { ContactService } from '../../features/contact/application/contact-service'
import { ContactRepository } from '../../features/contact/data/contact-repository'
import { ProductService } from '@ecommerce-api/features/product/application/product-service'
import { ProductRepository } from '@ecommerce-api/features/product/data/product-repository'
import { BillingWorkspaceService } from '@billing-api/features/workspace/application/billing-workspace-service'
import { BillingAccountingRepository } from '@billing-api/features/workspace/data/billing-accounting-repository'
import { MediaService } from '../../features/media/application/media-service'
import { MediaRepository } from '../../features/media/data/media-repository'
import { StorefrontOrderService } from '@ecommerce-api/features/storefront/application/storefront-order-service'
import { StorefrontOrderRepository } from '@ecommerce-api/features/storefront/data/storefront-order-repository'
import { CustomerProfileService } from '@ecommerce-api/features/customer-profile/application/customer-profile-service'
import { CustomerProfileRepository } from '@ecommerce-api/features/customer-profile/data/customer-profile-repository'
import { CommerceOrderWorkflowService } from '@ecommerce-api/features/commerce/application/commerce-order-workflow-service'
import { CommerceOrderWorkflowRepository } from '@ecommerce-api/features/commerce/data/commerce-order-workflow-repository'
import { CustomerHelpdeskService } from '@ecommerce-api/features/customer-helpdesk/application/customer-helpdesk-service'
import { CustomerHelpdeskRepository } from '@ecommerce-api/features/customer-helpdesk/data/customer-helpdesk-repository'
import { UserManagementService } from '../../features/users/application/user-management-service'
import { TaskService } from '../../features/task/application/task-service'
import { TaskRepository } from '../../features/task/data/task-repository'
import { MilestoneService } from '../../features/task/application/milestone-service'
import { MilestoneRepository } from '../../features/task/data/milestone-repository'
import { TaskGroupService } from '../../features/task/application/task-group-service'
import { TaskGroupRepository } from '../../features/task/data/task-group-repository'
import { NotificationService } from '../../features/notification/application/notification-service'
import { NotificationRepository } from '../../features/notification/data/notification-repository'
import {
  createFrappeItem,
  getFrappeItem,
  listFrappeItems,
  listFrappeItemProductSyncLogs,
  syncFrappeItemsToProducts,
  updateFrappeItem,
} from '../../features/frappe/application/frappe-item-service'
import {
  getFrappePurchaseReceipt,
  listFrappePurchaseReceipts,
  syncFrappePurchaseReceipts,
} from '../../features/frappe/application/frappe-purchase-receipt-service'
import {
  readFrappeSettings,
  saveFrappeSettings,
  verifyFrappeSettings,
} from '../../features/frappe/application/frappe-settings-service'
import { createFrappeTodo, listFrappeTodos, updateFrappeTodo } from '../../features/frappe/application/frappe-todo-service'
import {
  readSystemEnvironment,
  readSystemSettings,
  runManualUpdate,
  saveSystemEnvironment,
  saveSystemEnvironmentAndUpdate,
  saveSystemSettings,
} from '../../features/settings/application/system-settings-service'
import {
  readEcommerceSettings,
  saveEcommerceSettings,
} from '../../features/settings/application/ecommerce-settings-service'
import {
  backupDatabase,
  deleteDatabaseBackup,
  getHardResetConfirmationText,
  hardResetDatabase,
  migrateDatabaseToLatest,
  readDatabaseManager,
  restoreDatabase,
  readRestoreDatabaseJob,
  resolveBackupFilePath,
  uploadDatabaseBackup,
  verifyDatabaseManager,
} from '../../features/settings/application/database-maintenance-service'
import { GetBootstrapSnapshot } from '../../features/bootstrap/application/get-bootstrap-snapshot'
import { SystemOverviewRepository } from '../../features/bootstrap/data/system-overview-repository'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import {
  applyDatabaseSetup,
  getDatabaseHealth,
  getSetupStatus,
} from '@framework-core/runtime/database/database'
import { servePublicMediaAsset } from '@framework-core/runtime/media/storage'
import { getBearerToken, readJsonBody } from '@framework-core/runtime/http/request'
import { writeDownload, writeEmpty, writeJson } from '@framework-core/runtime/http/response'
import { serveBuiltWebApp } from '@framework-core/runtime/http/static-web'
import { getSystemUpdateCheck, getSystemVersion } from '@framework-core/runtime/version/system-version'
import { environment, resolveCorsOrigin } from '@framework-core/runtime/config/environment'
import {
  askSupportAssistant,
  readSupportAssistantStatus,
  reindexSupportAssistant,
} from '@framework-core/support/assistant-client'
import { getSupportKnowledgeManifest } from '@framework-core/support/knowledge-manifest'

const bootstrapUseCase = new GetBootstrapSnapshot(new SystemOverviewRepository())
const mailboxService = new MailboxService(new MailboxRepository())
const authService = new AuthService(new AuthUserRepository(), mailboxService)
const userManagementService = new UserManagementService(new AuthUserRepository())
const commonModuleService = new CommonModuleService(new CommonModuleRepository())
const companyService = new CompanyService(new CompanyRepository())
const contactService = new ContactService(new ContactRepository())
const productService = new ProductService(new ProductRepository())
const billingWorkspaceService = new BillingWorkspaceService(new BillingAccountingRepository())
const mediaService = new MediaService(new MediaRepository())
const storefrontOrderService = new StorefrontOrderService(new StorefrontOrderRepository())
const customerProfileRepository = new CustomerProfileRepository()
const customerProfileService = new CustomerProfileService(customerProfileRepository)
const commerceOrderWorkflowService = new CommerceOrderWorkflowService(new CommerceOrderWorkflowRepository())
const customerHelpdeskService = new CustomerHelpdeskService(
  new CustomerHelpdeskRepository(),
  customerProfileRepository,
  authService,
)
const notificationService = new NotificationService(new NotificationRepository())
const milestoneRepository = new MilestoneRepository()
const milestoneService = new MilestoneService(milestoneRepository)
const taskGroupRepository = new TaskGroupRepository()
const taskGroupService = new TaskGroupService(taskGroupRepository)
const taskService = new TaskService(
  new TaskRepository(),
  new ProductRepository(),
  notificationService,
  milestoneRepository,
  taskGroupRepository,
)

function parseBooleanFlag(value: string | null) {
  if (!value) {
    return false
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function resolveMediaPublicBaseUrl(request: IncomingMessage) {
  const forwardedProto = request.headers['x-forwarded-proto']
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto ?? 'http'
  const host = request.headers.host ?? `localhost:4000`
  return `${protocol}://${host}/media/public`
}

function isBlockedDuringSetupRecovery(pathname: string) {
  if (pathname.startsWith('/admin/dashboard')) {
    return false
  }

  if (
    pathname === '/admin/database-manager'
    || pathname === '/admin/database-manager/verify'
    || pathname === '/admin/database-manager/migrate'
    || pathname === '/admin/database-manager/backup'
    || pathname === '/admin/database-manager/restore'
    || pathname === '/admin/database-manager/hard-reset'
    || pathname === '/admin/database-manager/hard-reset/confirmation'
    || /^\/admin\/database-manager\/backups\/[^/]+$/.test(pathname)
  ) {
    return false
  }

  const blockedPrefixes = [
    '/admin/settings',
    '/admin/frappe',
    '/admin/system',
    '/admin/users',
    '/admin/commerce',
    '/admin/customers',
    '/bootstrap',
    '/companies',
    '/contacts',
    '/products',
    '/mailbox',
    '/storefront',
    '/customer',
    '/common',
    '/media',
    '/auth/register',
    '/auth/account-recovery',
    '/auth/password-reset',
  ]

  return blockedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

async function requireAuthenticatedUser(request: IncomingMessage) {
  const token = getBearerToken(request)
  if (!token) {
    throw new ApplicationError('Authorization token is required.', {}, 401)
  }

  return authService.getAuthenticatedUser(token)
}

async function requireBackofficeUser(request: IncomingMessage) {
  const user = await requireAuthenticatedUser(request)
  if (user.actorType !== 'admin' && user.actorType !== 'staff') {
    throw new ApplicationError('This route is available only to backoffice users.', { actorType: user.actorType }, 403)
  }

  return user
}

async function requireSuperAdminUser(request: IncomingMessage) {
  const user = await requireAuthenticatedUser(request)
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }

  return user
}

async function requireCustomerUser(request: IncomingMessage) {
  const user = await requireAuthenticatedUser(request)
  if (user.actorType !== 'customer') {
    throw new ApplicationError('This route is available only to customer users.', { actorType: user.actorType }, 403)
  }

  return user
}

export async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    response.setHeader('access-control-allow-origin', resolveCorsOrigin(request.headers))
    response.setHeader('access-control-allow-headers', 'authorization, content-type')
    response.setHeader('access-control-allow-methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    response.setHeader('vary', 'Origin')

    const method = request.method ?? 'GET'
    const url = new URL(request.url ?? '/', 'http://localhost')

    if (method === 'OPTIONS') {
      writeEmpty(response, 204)
      return
    }

    if (method === 'GET' && url.pathname === '/health') {
      const database = getDatabaseHealth()

      writeJson(response, 200, {
        status: 'ok',
        service: 'codexsun-api',
        timestamp: new Date().toISOString(),
        database,
        setup: getSetupStatus(),
      })
      return
    }

    if (method === 'GET' && url.pathname === '/health/db') {
      writeJson(response, 200, getDatabaseHealth())
      return
    }

    if (method === 'GET' && url.pathname === '/framework/manifest') {
      writeJson(response, 200, getFrameworkManifest())
      return
    }

    if (method === 'GET' && url.pathname === '/support/knowledge-manifest') {
      writeJson(response, 200, getSupportKnowledgeManifest())
      return
    }

    if (method === 'GET' && url.pathname === '/support/assistant/status') {
      writeJson(response, 200, {
        assistant: await readSupportAssistantStatus(),
      })
      return
    }

    if (method === 'POST' && url.pathname === '/support/assistant/chat') {
      writeJson(response, 200, await askSupportAssistant(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/system/version') {
      writeJson(response, 200, await getSystemVersion())
      return
    }

    if (method === 'GET' && url.pathname === '/admin/system/update-check') {
      if (getSetupStatus().status !== 'ready') {
        throw new ApplicationError(
          'codexsun is running in setup recovery mode. Only setup and database migration tools are available.',
          { setupStatus: getSetupStatus().status, detail: getSetupStatus().detail },
          503,
        )
      }

      await requireAuthenticatedUser(request)
      writeJson(response, 200, await getSystemUpdateCheck())
      return
    }

    if (method === 'GET' && url.pathname === '/setup/status') {
      writeJson(response, 200, {
        status: getSetupStatus(),
      })
      return
    }

    if (method === 'POST' && url.pathname === '/setup/database') {
      writeJson(
        response,
        200,
        await applyDatabaseSetup(await readJsonBody(request), {
          mediaPublicBaseUrl: resolveMediaPublicBaseUrl(request),
        }),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/auth/login') {
      writeJson(response, 200, await authService.login(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/recovery-login') {
      writeJson(response, 200, await authService.recoveryLogin(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/auth/me') {
      writeJson(response, 200, await requireAuthenticatedUser(request))
      return
    }

    if (getSetupStatus().status !== 'ready' && isBlockedDuringSetupRecovery(url.pathname)) {
      throw new ApplicationError(
        'codexsun is running in setup recovery mode. Only setup and database migration tools are available.',
        { setupStatus: getSetupStatus().status, detail: getSetupStatus().detail },
        503,
      )
    }

    if (method === 'GET' && url.pathname === '/admin/settings/system') {
      writeJson(response, 200, readSystemSettings(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/ecommerce/settings') {
      writeJson(response, 200, readEcommerceSettings(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/settings/environment') {
      writeJson(response, 200, readSystemEnvironment(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/frappe/settings') {
      writeJson(response, 200, readFrappeSettings(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/frappe/todos') {
      writeJson(response, 200, await listFrappeTodos(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/frappe/items') {
      writeJson(response, 200, await listFrappeItems(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/frappe/items/sync-logs') {
      writeJson(response, 200, await listFrappeItemProductSyncLogs(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/frappe/purchase-receipts') {
      writeJson(response, 200, await listFrappePurchaseReceipts(await requireAuthenticatedUser(request)))
      return
    }

    const frappePurchaseReceiptRecordMatch = url.pathname.match(/^\/admin\/frappe\/purchase-receipts\/([^/]+)$/)
    if (frappePurchaseReceiptRecordMatch && method === 'GET') {
      writeJson(
        response,
        200,
        await getFrappePurchaseReceipt(
          await requireAuthenticatedUser(request),
          decodeURIComponent(frappePurchaseReceiptRecordMatch[1]),
        ),
      )
      return
    }

    if (method === 'GET' && url.pathname === '/admin/database-manager') {
      writeJson(response, 200, await readDatabaseManager(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'PATCH' && url.pathname === '/admin/settings/system') {
      writeJson(
        response,
        200,
        saveSystemSettings(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'PATCH' && url.pathname === '/admin/ecommerce/settings') {
      writeJson(
        response,
        200,
        saveEcommerceSettings(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'PATCH' && url.pathname === '/admin/settings/environment') {
      writeJson(
        response,
        200,
        saveSystemEnvironment(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'PATCH' && url.pathname === '/admin/frappe/settings') {
      writeJson(
        response,
        200,
        saveFrappeSettings(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/frappe/todos') {
      writeJson(
        response,
        201,
        await createFrappeTodo(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/frappe/items') {
      writeJson(
        response,
        201,
        await createFrappeItem(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/frappe/items/sync-products') {
      writeJson(
        response,
        200,
        await syncFrappeItemsToProducts(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/frappe/purchase-receipts/sync') {
      writeJson(
        response,
        200,
        await syncFrappePurchaseReceipts(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/settings/system/update') {
      writeJson(
        response,
        202,
        runManualUpdate(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/settings/environment/update') {
      writeJson(
        response,
        202,
        saveSystemEnvironmentAndUpdate(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/frappe/settings/verify') {
      writeJson(
        response,
        200,
        await verifyFrappeSettings(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/admin/support/assistant/reindex') {
      await requireSuperAdminUser(request)
      writeJson(response, 202, {
        assistant: await reindexSupportAssistant(),
      })
      return
    }

    const frappeTodoRecordMatch = url.pathname.match(/^\/admin\/frappe\/todos\/([^/]+)$/)
    if (frappeTodoRecordMatch && method === 'PATCH') {
      writeJson(
        response,
        200,
        await updateFrappeTodo(
          await requireAuthenticatedUser(request),
          decodeURIComponent(frappeTodoRecordMatch[1]),
          await readJsonBody(request),
        ),
      )
      return
    }

    const frappeItemRecordMatch = url.pathname.match(/^\/admin\/frappe\/items\/([^/]+)$/)
    if (frappeItemRecordMatch) {
      const itemId = decodeURIComponent(frappeItemRecordMatch[1])

      if (method === 'GET') {
        writeJson(
          response,
          200,
          await getFrappeItem(await requireAuthenticatedUser(request), itemId),
        )
        return
      }

      if (method === 'PATCH') {
        writeJson(
          response,
          200,
          await updateFrappeItem(
            await requireAuthenticatedUser(request),
            itemId,
            await readJsonBody(request),
          ),
        )
        return
      }
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/verify') {
      writeJson(response, 200, await verifyDatabaseManager(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/migrate') {
      writeJson(response, 200, await migrateDatabaseToLatest(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/backup') {
      writeJson(response, 200, await backupDatabase(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/backups/upload') {
      writeJson(response, 200, await uploadDatabaseBackup(await requireAuthenticatedUser(request), await readJsonBody(request)))
      return
    }

    const databaseBackupMatch = url.pathname.match(/^\/admin\/database-manager\/backups\/([^/]+)$/)
    if (method === 'DELETE' && databaseBackupMatch) {
      const fileName = decodeURIComponent(databaseBackupMatch[1])
      writeJson(response, 200, await deleteDatabaseBackup(await requireAuthenticatedUser(request), fileName))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/restore') {
      writeJson(response, 200, await restoreDatabase(await requireAuthenticatedUser(request), await readJsonBody(request)))
      return
    }

    const databaseRestoreJobMatch = url.pathname.match(/^\/admin\/database-manager\/restore\/jobs\/([^/]+)$/)
    if (method === 'GET' && databaseRestoreJobMatch) {
      const jobId = decodeURIComponent(databaseRestoreJobMatch[1])
      writeJson(response, 200, await readRestoreDatabaseJob(await requireAuthenticatedUser(request), jobId))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/database-manager/hard-reset') {
      writeJson(
        response,
        200,
        await hardResetDatabase(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    if (method === 'GET' && databaseBackupMatch) {
      await requireSuperAdminUser(request)
      const fileName = databaseBackupMatch[1]
      const absolutePath = resolveBackupFilePath(fileName)

      if (!fs.existsSync(absolutePath)) {
        throw new ApplicationError('Backup file was not found.', { fileName }, 404)
      }

      writeDownload(response, 200, 'application/json; charset=utf-8', fileName, fs.readFileSync(absolutePath))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/database-manager/hard-reset/confirmation') {
      await requireSuperAdminUser(request)
      writeJson(response, 200, { confirmation: getHardResetConfirmationText() })
      return
    }

    if (method === 'GET' && url.pathname === '/bootstrap') {
      writeJson(response, 200, bootstrapUseCase.execute())
      return
    }

    if (method === 'GET' && url.pathname === '/companies') {
      writeJson(response, 200, await companyService.list())
      return
    }

    if (method === 'GET' && url.pathname === '/contacts') {
      writeJson(response, 200, await contactService.list())
      return
    }

    if (method === 'GET' && url.pathname === '/products') {
      writeJson(response, 200, await productService.list())
      return
    }

    if (method === 'GET' && url.pathname === '/tasks') {
      const user = await requireAuthenticatedUser(request)
      const entityType = url.searchParams.get('entityType')
      const entityId = url.searchParams.get('entityId')
      const milestoneId = url.searchParams.get('milestoneId')
      if (entityType && entityId) {
        writeJson(response, 200, await taskService.listByEntity(entityType, entityId))
        return
      }
      if (user.actorType === 'admin') {
        writeJson(response, 200, await taskService.listAll({ milestoneId }))
      } else {
        writeJson(response, 200, await taskService.listForUser(user.id, { milestoneId }))
      }
      return
    }

    if (method === 'GET' && url.pathname === '/milestones') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await milestoneService.list(user, {
        status: url.searchParams.get('status'),
        entityType: url.searchParams.get('entityType'),
        entityId: url.searchParams.get('entityId'),
      }))
      return
    }

    if (method === 'GET' && url.pathname === '/task-groups') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await taskGroupService.list(user, {
        status: url.searchParams.get('status'),
        type: url.searchParams.get('type'),
      }))
      return
    }

    if (method === 'GET' && url.pathname === '/tasks/insights') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await taskService.getInsights(user.id))
      return
    }

    if (method === 'GET' && url.pathname === '/notifications') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await notificationService.listForUser(user.id))
      return
    }

    if (method === 'POST' && url.pathname === '/notifications/read-all') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await notificationService.markAllRead(user.id))
      return
    }

    const notificationTaskReadMatch = url.pathname.match(/^\/notifications\/tasks\/([^/]+)\/read$/)
    if (method === 'POST' && notificationTaskReadMatch) {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await notificationService.markReadByTask(user.id, notificationTaskReadMatch[1]))
      return
    }

    if (method === 'GET' && url.pathname === '/tasks/audit') {
      await requireAuthenticatedUser(request)
      writeJson(response, 200, await taskService.getAuditList({
        templateId: url.searchParams.get('templateId'),
        assigneeId: url.searchParams.get('assigneeId'),
        status: url.searchParams.get('status'),
        verificationState: url.searchParams.get('verificationState'),
        dateFrom: url.searchParams.get('dateFrom'),
        dateTo: url.searchParams.get('dateTo'),
      }))
      return
    }

    const notificationRecordMatch = url.pathname.match(/^\/notifications\/([^/]+)\/read$/)
    if (method === 'POST' && notificationRecordMatch) {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await notificationService.markRead(user.id, notificationRecordMatch[1]))
      return
    }

    if (method === 'POST' && url.pathname === '/tasks') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskService.create(user, await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/milestones') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await milestoneService.create(user, await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/task-groups') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskGroupService.create(user, await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/tasks/from-template') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskService.createFromTemplate(user, await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/tasks/from-template/bulk') {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskService.createBulkFromTemplate(user, await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/task-templates') {
      await requireAuthenticatedUser(request)
      writeJson(response, 200, await taskService.listTemplates(url.searchParams.get('scopeType')))
      return
    }

    if (method === 'POST' && url.pathname === '/task-templates') {
      await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskService.createTemplate(await readJsonBody(request)))
      return
    }

    const taskTemplateMatch = url.pathname.match(/^\/task-templates\/([^/]+)$/)
    if (taskTemplateMatch) {
      const templateId = taskTemplateMatch[1]
      await requireAuthenticatedUser(request)

      if (method === 'GET') {
        writeJson(response, 200, await taskService.getTemplateById(templateId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await taskService.updateTemplate(templateId, await readJsonBody(request)))
        return
      }
    }

    const taskRecordMatch = url.pathname.match(/^\/tasks\/([^/]+)$/)
    if (taskRecordMatch) {
      const taskId = taskRecordMatch[1]
      const user = await requireAuthenticatedUser(request)

      if (method === 'GET') {
        writeJson(response, 200, await taskService.getById(taskId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await taskService.update(taskId, user, await readJsonBody(request)))
        return
      }
    }

    const taskFinalizeMatch = url.pathname.match(/^\/tasks\/([^/]+)\/finalize$/)
    if (method === 'POST' && taskFinalizeMatch) {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 200, await taskService.finalize(taskFinalizeMatch[1], user))
      return
    }

    const milestoneRecordMatch = url.pathname.match(/^\/milestones\/([^/]+)$/)
    if (milestoneRecordMatch) {
      const milestoneId = milestoneRecordMatch[1]
      const user = await requireAuthenticatedUser(request)

      if (method === 'GET') {
        writeJson(response, 200, await milestoneService.getById(user, milestoneId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await milestoneService.update(user, milestoneId, await readJsonBody(request)))
        return
      }
    }

    const taskGroupRecordMatch = url.pathname.match(/^\/task-groups\/([^/]+)$/)
    if (taskGroupRecordMatch) {
      const taskGroupId = taskGroupRecordMatch[1]
      const user = await requireAuthenticatedUser(request)

      if (method === 'GET') {
        writeJson(response, 200, await taskGroupService.getById(user, taskGroupId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await taskGroupService.update(user, taskGroupId, await readJsonBody(request)))
        return
      }
    }

    const taskActivityMatch = url.pathname.match(/^\/tasks\/([^/]+)\/activities$/)
    if (method === 'POST' && taskActivityMatch) {
      const user = await requireAuthenticatedUser(request)
      writeJson(response, 201, await taskService.addActivity(taskActivityMatch[1], user.id, await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/mailbox/messages') {
      writeJson(response, 200, await mailboxService.listMessages())
      return
    }

    if (method === 'POST' && url.pathname === '/mailbox/messages/send') {
      writeJson(response, 201, await mailboxService.send(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/mailbox/templates') {
      writeJson(
        response,
        200,
        await mailboxService.listTemplates(parseBooleanFlag(url.searchParams.get('includeInactive'))),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/mailbox/templates') {
      writeJson(response, 201, await mailboxService.createTemplate(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/storefront/catalog') {
      writeJson(response, 200, await productService.getStorefrontCatalog())
      return
    }

    if (method === 'POST' && url.pathname === '/storefront/checkout') {
      writeJson(response, 201, await storefrontOrderService.create(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/storefront/checkout/verify-payment') {
      writeJson(response, 200, await storefrontOrderService.verifyPayment(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/customer/orders') {
      const customer = await requireCustomerUser(request)
      writeJson(response, 200, await storefrontOrderService.listCustomerOrders(customer.email))
      return
    }

    const customerOrderWorkflowMatch = url.pathname.match(/^\/customer\/orders\/([^/]+)\/workflow$/)
    if (customerOrderWorkflowMatch && method === 'GET') {
      const customer = await requireCustomerUser(request)
      writeJson(
        response,
        200,
        await commerceOrderWorkflowService.getCustomerWorkflow(customer, customerOrderWorkflowMatch[1]),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/customer/account/change-password') {
      const customer = await requireCustomerUser(request)
      writeJson(response, 200, await authService.changePassword(customer, await readJsonBody(request)))
      return
    }

    if (method === 'DELETE' && url.pathname === '/customer/account') {
      const customer = await requireCustomerUser(request)
      writeJson(response, 200, await authService.deleteAccount(customer, await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/commerce/orders') {
      writeJson(response, 200, await commerceOrderWorkflowService.listOrders(await requireBackofficeUser(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/billing/workspace') {
      await requireBackofficeUser(request)
      writeJson(response, 200, await billingWorkspaceService.getWorkspace())
      return
    }

    if (method === 'GET' && url.pathname === '/admin/customers/helpdesk') {
      writeJson(response, 200, await customerHelpdeskService.listCustomers(await requireBackofficeUser(request)))
      return
    }

    const mediaPublicMatch = url.pathname.match(/^\/media\/public\/(.+)$/)
    if (method === 'GET' && mediaPublicMatch) {
      await servePublicMediaAsset(response, mediaPublicMatch[1])
      return
    }

    if (method === 'GET' && url.pathname === '/media') {
      writeJson(response, 200, await mediaService.list())
      return
    }

    if (method === 'GET' && url.pathname === '/media/folders') {
      writeJson(response, 200, await mediaService.listFolders())
      return
    }

    const companyRestoreMatch = url.pathname.match(/^\/companies\/([^/]+)\/restore$/)
    if (method === 'POST' && companyRestoreMatch) {
      writeJson(response, 200, await companyService.restore(companyRestoreMatch[1]))
      return
    }

    const contactRestoreMatch = url.pathname.match(/^\/contacts\/([^/]+)\/restore$/)
    if (method === 'POST' && contactRestoreMatch) {
      writeJson(response, 200, await contactService.restore(contactRestoreMatch[1]))
      return
    }

    const productRestoreMatch = url.pathname.match(/^\/products\/([^/]+)\/restore$/)
    if (method === 'POST' && productRestoreMatch) {
      writeJson(response, 200, await productService.restore(productRestoreMatch[1]))
      return
    }

    const mailboxTemplateRestoreMatch = url.pathname.match(/^\/mailbox\/templates\/([^/]+)\/restore$/)
    if (method === 'POST' && mailboxTemplateRestoreMatch) {
      writeJson(response, 200, await mailboxService.restoreTemplate(mailboxTemplateRestoreMatch[1]))
      return
    }

    const mediaFolderRestoreMatch = url.pathname.match(/^\/media\/folders\/([^/]+)\/restore$/)
    if (method === 'POST' && mediaFolderRestoreMatch) {
      writeJson(response, 200, await mediaService.restoreFolder(mediaFolderRestoreMatch[1]))
      return
    }

    const mediaRestoreMatch = url.pathname.match(/^\/media\/([^/]+)\/restore$/)
    if (method === 'POST' && mediaRestoreMatch) {
      writeJson(response, 200, await mediaService.restore(mediaRestoreMatch[1]))
      return
    }

    const companyRecordMatch = url.pathname.match(/^\/companies\/([^/]+)$/)
    if (companyRecordMatch) {
      const companyId = companyRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await companyService.getById(companyId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await companyService.update(companyId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await companyService.deactivate(companyId))
        return
      }
    }

    const contactRecordMatch = url.pathname.match(/^\/contacts\/([^/]+)$/)
    if (contactRecordMatch) {
      const contactId = contactRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await contactService.getById(contactId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await contactService.update(contactId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await contactService.deactivate(contactId))
        return
      }
    }

    const productRecordMatch = url.pathname.match(/^\/products\/([^/]+)$/)
    if (productRecordMatch) {
      const productId = productRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await productService.getById(productId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await productService.update(productId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await productService.deactivate(productId))
        return
      }
    }

    const mailboxMessageRecordMatch = url.pathname.match(/^\/mailbox\/messages\/([^/]+)$/)
    if (mailboxMessageRecordMatch) {
      if (method === 'GET') {
        writeJson(response, 200, await mailboxService.getMessageById(mailboxMessageRecordMatch[1]))
        return
      }
    }

    const mailboxTemplateRecordMatch = url.pathname.match(/^\/mailbox\/templates\/([^/]+)$/)
    if (mailboxTemplateRecordMatch) {
      const templateId = mailboxTemplateRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await mailboxService.getTemplateById(templateId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await mailboxService.updateTemplate(templateId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await mailboxService.deactivateTemplate(templateId))
        return
      }
    }

    const mediaFolderRecordMatch = url.pathname.match(/^\/media\/folders\/([^/]+)$/)
    if (mediaFolderRecordMatch) {
      const folderId = mediaFolderRecordMatch[1]

      if (method === 'PATCH') {
        writeJson(response, 200, await mediaService.updateFolder(folderId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await mediaService.deactivateFolder(folderId))
        return
      }
    }

    const mediaRecordMatch = url.pathname.match(/^\/media\/([^/]+)$/)
    if (mediaRecordMatch) {
      const mediaId = mediaRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await mediaService.getById(mediaId))
        return
      }

      if (method === 'PATCH') {
        writeJson(response, 200, await mediaService.update(mediaId, await readJsonBody(request)))
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await mediaService.deactivate(mediaId))
        return
      }
    }

    const commerceWorkflowMatch = url.pathname.match(/^\/admin\/commerce\/orders\/([^/]+)\/workflow$/)
    if (commerceWorkflowMatch) {
      const orderId = commerceWorkflowMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await commerceOrderWorkflowService.getWorkflow(await requireBackofficeUser(request), orderId))
        return
      }

      if (method === 'POST') {
        writeJson(
          response,
          200,
          await commerceOrderWorkflowService.applyWorkflowAction(
            await requireBackofficeUser(request),
            orderId,
            await readJsonBody(request),
          ),
        )
        return
      }
    }

    const commerceInvoicePrintMatch = url.pathname.match(/^\/admin\/commerce\/orders\/([^/]+)\/invoice\/print$/)
    if (method === 'GET' && commerceInvoicePrintMatch) {
      const document = await commerceOrderWorkflowService.renderInvoice(
        await requireBackofficeUser(request),
        commerceInvoicePrintMatch[1],
      )
      response.writeHead(200, {
        'content-type': `${document.mediaType}; charset=utf-8`,
        'content-disposition': `inline; filename="${document.fileName}"`,
        'access-control-allow-origin': resolveCorsOrigin(request.headers),
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        vary: 'Origin',
      })
      response.end(document.html)
      return
    }

    const customerHelpdeskRecordMatch = url.pathname.match(/^\/admin\/customers\/helpdesk\/([^/]+)$/)
    if (customerHelpdeskRecordMatch && method === 'GET') {
      writeJson(
        response,
        200,
        await customerHelpdeskService.getCustomer(await requireBackofficeUser(request), customerHelpdeskRecordMatch[1]),
      )
      return
    }

    const customerHelpdeskPasswordResetMatch = url.pathname.match(/^\/admin\/customers\/helpdesk\/([^/]+)\/password-reset\/request$/)
    if (customerHelpdeskPasswordResetMatch && method === 'POST') {
      writeJson(
        response,
        200,
        await customerHelpdeskService.sendPasswordReset(await requireBackofficeUser(request), customerHelpdeskPasswordResetMatch[1]),
      )
      return
    }

    const customerHelpdeskRecoveryMatch = url.pathname.match(/^\/admin\/customers\/helpdesk\/([^/]+)\/account-recovery\/request$/)
    if (customerHelpdeskRecoveryMatch && method === 'POST') {
      writeJson(
        response,
        200,
        await customerHelpdeskService.sendRecoveryEmail(await requireBackofficeUser(request), customerHelpdeskRecoveryMatch[1]),
      )
      return
    }

    if (method === 'POST' && url.pathname === '/companies') {
      writeJson(response, 201, await companyService.create(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/contacts') {
      writeJson(response, 201, await contactService.create(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/products') {
      writeJson(response, 201, await productService.create(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/media') {
      writeJson(response, 201, await mediaService.create(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/media/upload-image') {
      writeJson(response, 201, await mediaService.uploadImage(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/media/folders') {
      writeJson(response, 201, await mediaService.createFolder(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/common/modules') {
      writeJson(response, 200, commonModuleService.listModuleMetadata())
      return
    }

    const commonModuleMetadataMatch = url.pathname.match(/^\/common\/modules\/([^/]+)$/)
    if (method === 'GET' && commonModuleMetadataMatch) {
      writeJson(
        response,
        200,
        commonModuleService.getModuleMetadata(commonModuleMetadataMatch[1] as CommonModuleKey),
      )
      return
    }

    const commonModuleRestoreMatch = url.pathname.match(/^\/common\/([^/]+)\/([^/]+)\/restore$/)
    if (method === 'POST' && commonModuleRestoreMatch) {
      writeJson(
        response,
        200,
        await commonModuleService.restore(
          commonModuleRestoreMatch[1] as CommonModuleKey,
          commonModuleRestoreMatch[2],
        ),
      )
      return
    }

    const commonModuleRecordMatch = url.pathname.match(/^\/common\/([^/]+)\/([^/]+)$/)
    if (commonModuleRecordMatch) {
      const moduleKey = commonModuleRecordMatch[1] as CommonModuleKey
      const recordId = commonModuleRecordMatch[2]

      if (method === 'GET') {
        writeJson(response, 200, await commonModuleService.getRecord(moduleKey, recordId))
        return
      }

      if (method === 'PATCH') {
        writeJson(
          response,
          200,
          await commonModuleService.update(moduleKey, recordId, await readJsonBody(request)),
        )
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await commonModuleService.deactivate(moduleKey, recordId))
        return
      }
    }

    const commonModuleCollectionMatch = url.pathname.match(/^\/common\/([^/]+)$/)
    if (commonModuleCollectionMatch) {
      const moduleKey = commonModuleCollectionMatch[1] as CommonModuleKey

      if (method === 'GET') {
        writeJson(
          response,
          200,
          await commonModuleService.list(
            moduleKey,
            parseBooleanFlag(url.searchParams.get('includeInactive')),
          ),
        )
        return
      }

      if (method === 'POST') {
        writeJson(
          response,
          201,
          await commonModuleService.create(moduleKey, await readJsonBody(request)),
        )
        return
      }
    }

    if (method === 'POST' && url.pathname === '/auth/register') {
      writeJson(response, 201, await authService.register(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/register/request-otp') {
      writeJson(response, 200, await authService.requestRegisterOtp(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/register/verify-otp') {
      writeJson(response, 200, await authService.verifyRegisterOtp(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/account-recovery/request-otp') {
      writeJson(response, 200, await authService.requestAccountRecoveryOtp(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/password-reset/request-otp') {
      writeJson(response, 200, await authService.requestPasswordResetOtp(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/password-reset/confirm') {
      writeJson(response, 200, await authService.confirmPasswordReset(await readJsonBody(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/auth/account-recovery/restore') {
      writeJson(response, 200, await authService.restoreAccount(await readJsonBody(request)))
      return
    }

    if (method === 'GET' && url.pathname === '/admin/users') {
      writeJson(response, 200, await userManagementService.list(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'POST' && url.pathname === '/admin/users') {
      writeJson(
        response,
        201,
        await userManagementService.create(await requireAuthenticatedUser(request), await readJsonBody(request)),
      )
      return
    }

    const adminUserRestoreMatch = url.pathname.match(/^\/admin\/users\/([^/]+)\/restore$/)
    if (method === 'POST' && adminUserRestoreMatch) {
      writeJson(
        response,
        200,
        await userManagementService.restore(await requireAuthenticatedUser(request), adminUserRestoreMatch[1]),
      )
      return
    }

    const adminUserRecordMatch = url.pathname.match(/^\/admin\/users\/([^/]+)$/)
    if (adminUserRecordMatch) {
      const userId = adminUserRecordMatch[1]

      if (method === 'GET') {
        writeJson(response, 200, await userManagementService.getById(await requireAuthenticatedUser(request), userId))
        return
      }

      if (method === 'PATCH') {
        writeJson(
          response,
          200,
          await userManagementService.update(await requireAuthenticatedUser(request), userId, await readJsonBody(request)),
        )
        return
      }

      if (method === 'DELETE') {
        writeJson(response, 200, await userManagementService.deactivate(await requireAuthenticatedUser(request), userId))
        return
      }
    }

    if (method === 'GET' && url.pathname === '/customer/profile') {
      writeJson(response, 200, await customerProfileService.getProfile(await requireAuthenticatedUser(request)))
      return
    }

    if (method === 'PATCH' && url.pathname === '/customer/profile') {
      writeJson(
        response,
        200,
        await customerProfileService.saveProfile(
          await requireAuthenticatedUser(request),
          await readJsonBody(request),
        ),
      )
      return
    }

    if ((method === 'GET' || method === 'HEAD') && (await serveBuiltWebApp(response, url.pathname))) {
      return
    }

    throw new ApplicationError('Route not found.', { method, path: url.pathname }, 404)
  } catch (error) {
    if (error instanceof ZodError) {
      writeJson(response, 400, {
        error: 'Validation failed.',
        context: { issues: error.flatten() },
      })
      return
    }

    if (error instanceof ApplicationError) {
      writeJson(response, error.statusCode, {
        error: error.message,
        context: error.context,
      })
      return
    }

    const unknownError = error instanceof Error ? error.message : 'Unknown error'
    writeJson(response, 500, {
      error: environment.app.debug ? unknownError : 'Unhandled server error.',
      context: environment.app.debug ? { detail: unknownError } : undefined,
    })
  }
}
