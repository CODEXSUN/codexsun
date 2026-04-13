import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  getRuntimeSettingsSnapshot,
  resolveRuntimeSettingsRoot,
  saveRuntimeSettings,
} from "../../../framework/src/runtime/config/runtime-settings-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import {
  listActivityLogs,
  writeFrameworkActivityFromContext,
} from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import { getMonitoringDashboard } from "../../../framework/src/runtime/monitoring/monitoring-service.js"
import {
  createDatabaseBackup,
  listDatabaseBackupDashboard,
  restoreDatabaseBackup,
  runDatabaseRestoreDrill,
} from "../../../framework/src/runtime/operations/database-backup-service.js"
import {
  completeSecurityReview,
  getSecurityReviewDashboard,
  updateSecurityReviewItem,
} from "../../../framework/src/runtime/operations/security-review-service.js"
import { getRuntimeJobDashboard } from "../../../framework/src/runtime/jobs/runtime-job-dashboard-service.js"
import {
  createMediaFolder,
  getMedia,
  listMedia,
  listMediaFolders,
  readMediaContent,
  toggleMediaActive,
  toggleMediaFolderActive,
  updateMedia,
  updateMediaFolder,
  uploadMediaImage,
} from "../../../framework/src/runtime/media/media-service.js"
import {
  getSystemUpdatePreview,
  getSystemUpdateStatus,
  listSystemUpdateHistory,
  resetSystemToLastCommit,
  runSystemUpdate,
} from "../../../framework/src/runtime/system-update/system-update-service.js"
import { runDeveloperOperation } from "../../../framework/src/runtime/operations/developer-operations-service.js"
import {
  getHostedAppsStatus,
  runHostedAppsCleanSoftwareUpdate,
} from "../../../framework/src/runtime/operations/hosted-apps-service.js"
import {
  createRemoteServerTarget,
  deleteRemoteServerTarget,
  getRemoteServerDashboard,
  getRemoteServerStatus,
  getRemoteServerTarget,
  generateRemoteServerTargetSecret,
  generateRemoteMonitorSecretString,
  updateRemoteServerTarget,
} from "../../../framework/src/runtime/operations/remote-server-status-service.js"
import { triggerRemoteServerGitUpdate } from "../../../framework/src/runtime/operations/remote-server-control-service.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createFrameworkInternalRoutes(): HttpRouteDefinition[] {
  const requireFrameworkSuperAdmin = async (
    context: Parameters<typeof requireAuthenticatedUser>[0]
  ) => {
    const session = await requireAuthenticatedUser(context, {
      allowedActorTypes: ["admin"],
    })

    if (!session.user.isSuperAdmin) {
      throw new ApplicationError(
        "Only super admins can access remote server controls.",
        {},
        403
      )
    }

    return session
  }

  return [
    defineInternalRoute("/framework/system-update", {
      summary: "Read repository status and auto-update readiness for the framework shell.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getSystemUpdateStatus(context.config))
      },
    }),
    defineInternalRoute("/framework/system-update/history", {
      summary: "Read recent system update and reset activity for the framework shell.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await listSystemUpdateHistory(context.config))
      },
    }),
    defineInternalRoute("/framework/system-update/preview", {
      summary: "Read the pending commit list from the configured runtime git branch before update.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getSystemUpdatePreview(context.config))
      },
    }),
    defineInternalRoute("/framework/system-update", {
      method: "POST",
      summary: "Discard runtime worktree drift, sync from the configured git branch, rebuild cleanly, and restart.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const response = await runSystemUpdate(context.config, undefined, user.email)

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "system-update.run",
          message: "System update was triggered from the admin workspace.",
          details: {
            canAutoUpdate: response.status.canAutoUpdate,
            hasRemoteUpdate: response.status.hasRemoteUpdate,
            branch: response.status.branch,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/system-update/reset", {
      method: "POST",
      summary: "Force reset the runtime git worktree to the current commit, clean local files, rebuild, and restart.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const response = await resetSystemToLastCommit(
          context.config,
          context.request.jsonBody,
          undefined,
          user.email
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "system-update.reset",
          level: "warn",
          message: "System reset was triggered from the admin workspace.",
          details: {
            branch: response.status.branch,
            localChanges: response.status.localChanges.length,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/hosted-apps", {
      summary: "Read live hosted client app status for Docker-managed suite deployments.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getHostedAppsStatus(context.config))
      },
    }),
    defineInternalRoute("/framework/hosted-apps/update-clean", {
      method: "POST",
      summary: "Run a clean software update using git-sync update when available, or a forced clean rebuild otherwise.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const response = await runHostedAppsCleanSoftwareUpdate(context.config, {
          actor: user.email,
        })

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "hosted-apps.update-clean",
          level: "warn",
          message: "Clean software update was triggered from the hosted apps workspace.",
          details: {
            mode: response.mode,
            restartScheduled: response.restartScheduled,
            rootPath: response.rootPath,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/remote-servers", {
      summary: "Read live remote server status for super-admin-managed server targets.",
      handler: async (context) => {
        await requireFrameworkSuperAdmin(context)

        return jsonResponse(
          await getRemoteServerDashboard(context.config, context.databases.primary)
        )
      },
    }),
    defineInternalRoute("/framework/remote-server", {
      summary: "Read one saved remote server target and its live status.",
      handler: async (context) => {
        await requireFrameworkSuperAdmin(context)
        const targetId = context.request.url.searchParams.get("id")

        if (!targetId) {
          throw new ApplicationError("Remote server target id is required.", {}, 400)
        }

        const [target, status] = await Promise.all([
          getRemoteServerTarget(context.databases.primary, targetId),
          getRemoteServerStatus(context.config, context.databases.primary, targetId),
        ])

        return jsonResponse({
          item: {
            id: target.item.id,
            name: target.item.name,
            baseUrl: target.item.baseUrl,
            description: target.item.description,
            isActive: target.item.isActive,
            hasMonitorSecret: target.item.hasMonitorSecret,
            confirmedAt: target.item.confirmedAt,
            createdAt: target.item.createdAt,
            updatedAt: target.item.updatedAt,
            createdBy: target.item.createdBy,
            updatedBy: target.item.updatedBy,
          },
          status,
        })
      },
    }),
    defineInternalRoute("/framework/remote-servers", {
      method: "POST",
      summary: "Create a new remote server target for live status checks.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)

        const response = await createRemoteServerTarget(
          context.databases.primary,
          context.request.jsonBody,
          user.email
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.create",
          message: "A remote server target was added from the admin workspace.",
          details: {
            targetId: response.item.id,
            targetName: response.item.name,
            baseUrl: response.item.baseUrl,
          },
        })

        return jsonResponse(response, 201)
      },
    }),
    defineInternalRoute("/framework/remote-server-secret/generate", {
      method: "POST",
      summary: "Generate a remote monitor secret, save it into runtime .env, and return the saved snapshot.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)
        const runtimeSettingsRoot = resolveRuntimeSettingsRoot(context.config)
        const currentSnapshot = getRuntimeSettingsSnapshot(runtimeSettingsRoot)
        const generatedSecret = generateRemoteMonitorSecretString()

        const response = await saveRuntimeSettings(
          {
            restart: false,
            values: {
              ...currentSnapshot.values,
              SERVER_MONITOR_SHARED_SECRET: generatedSecret,
            },
          },
          runtimeSettingsRoot
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.generate-secret-value",
          message: "A remote server monitor secret was generated and saved to runtime settings.",
          details: {
            targetMode: "manual",
            saved: response.saved,
          },
        })

        return jsonResponse({
          generatedSecret,
          snapshot: response.snapshot,
        })
      },
    }),
    defineInternalRoute("/framework/remote-server", {
      method: "PATCH",
      summary: "Edit one remote server target and optionally save a pasted monitor secret.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)
        const targetId = context.request.url.searchParams.get("id")

        if (!targetId) {
          throw new ApplicationError("Remote server target id is required.", {}, 400)
        }

        const response = await updateRemoteServerTarget(
          context.databases.primary,
          targetId,
          context.request.jsonBody,
          user.email
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.update",
          message: "A remote server target was updated from the admin workspace.",
          details: {
            targetId,
            targetName: response.item.name,
            baseUrl: response.item.baseUrl,
            hasMonitorSecret: response.item.hasMonitorSecret,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/remote-server/git-update", {
      method: "POST",
      summary: "Trigger the shared-secret protected one-way git update on one saved remote server target.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)
        const targetId = context.request.url.searchParams.get("id")

        if (!targetId) {
          throw new ApplicationError("Remote server target id is required.", {}, 400)
        }

        const response = await triggerRemoteServerGitUpdate(
          context.config,
          context.databases.primary,
          targetId,
          context.request.jsonBody
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.git-update",
          level: response.mode === "override_dirty_update" ? "warn" : "info",
          message: "A one-way remote git update was triggered from the admin workspace.",
          details: {
            targetId,
            mode: response.mode,
            overrideDirty: response.overrideDirty,
            updated: response.update.updated,
            restartScheduled: response.update.restartScheduled,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/remote-server/generate-secret", {
      method: "POST",
      summary: "Generate and save a dedicated monitor secret for one remote server target.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)
        const targetId = context.request.url.searchParams.get("id")

        if (!targetId) {
          throw new ApplicationError("Remote server target id is required.", {}, 400)
        }

        const response = await generateRemoteServerTargetSecret(
          context.databases.primary,
          targetId,
          user.email
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.generate-secret",
          message: "A dedicated remote server monitor secret was generated.",
          details: {
            targetId,
            targetName: response.item.name,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/remote-server", {
      method: "DELETE",
      summary: "Delete one saved remote server target.",
      handler: async (context) => {
        const { user } = await requireFrameworkSuperAdmin(context)
        const targetId = context.request.url.searchParams.get("id")

        if (!targetId) {
          throw new ApplicationError("Remote server target id is required.", {}, 400)
        }

        const response = await deleteRemoteServerTarget(context.databases.primary, targetId)

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "remote-servers.delete",
          level: "warn",
          message: "A remote server target was deleted from the admin workspace.",
          details: {
            targetId,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/developer-operations", {
      method: "POST",
      summary: "Run admin-only frontend build recovery actions such as build, cache clear, and force clean rebuild.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const response = await runDeveloperOperation(context.config, context.request.jsonBody)

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: `developer-operations.${response.action}`,
          level: response.action === "force_clean_rebuild" ? "warn" : "info",
          message: "Developer build recovery action was triggered from the admin workspace.",
          details: {
            action: response.action,
            restartScheduled: response.restartScheduled,
            clearedPaths: response.clearedPaths,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/framework/activity-log", {
      summary: "List framework activity log records recorded by runtime and admin actions.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await listActivityLogs(context.databases.primary, {
            category: context.request.url.searchParams.get("category"),
            level: context.request.url.searchParams.get("level"),
            limit: context.request.url.searchParams.get("limit")
              ? Number(context.request.url.searchParams.get("limit"))
              : undefined,
          })
        )
      },
    }),
    defineInternalRoute("/framework/activity-log/test", {
      method: "POST",
      summary: "Write a test framework activity log record from the admin workspace.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await writeFrameworkActivityFromContext(context, user, {
            category: "validation",
            action: "activity-log.test",
            message: "A test activity log entry was created from the admin workspace.",
            details: {
              source: "cxapp",
            },
          }),
          201
        )
      },
    }),
    defineInternalRoute("/framework/alerts-dashboard", {
      summary: "Read monitoring status and alert thresholds for checkout, payment, webhook, order, and mail flows.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const windowHours = context.request.url.searchParams.get("windowHours")
          ? Number(context.request.url.searchParams.get("windowHours"))
          : undefined

        return jsonResponse(
          await getMonitoringDashboard(context.databases.primary, context.config, {
            windowHours,
          })
        )
      },
    }),
    defineInternalRoute("/framework/runtime-jobs", {
      summary: "Read framework background-job queue health, recent executions, and worker-visible job records.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const status = context.request.url.searchParams.get("status")
        const limit = context.request.url.searchParams.get("limit")

        return jsonResponse(
          await getRuntimeJobDashboard(context.databases.primary, {
            status:
              status === "queued" ||
              status === "running" ||
              status === "completed" ||
              status === "failed" ||
              status === "all"
                ? status
                : "all",
            limit: limit ? Number(limit) : undefined,
          })
        )
      },
    }),
    defineInternalRoute("/framework/database-backups", {
      summary: "Read database backup status, restore history, and scheduler configuration.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await listDatabaseBackupDashboard(context.databases.primary, context.config)
        )
      },
    }),
    defineInternalRoute("/framework/database-backups/run", {
      method: "POST",
      summary: "Run a manual database backup immediately.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const item = await createDatabaseBackup(context.databases.primary, context.config, {
          trigger: "manual",
        })

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "database-backup.run",
          message: "Manual database backup was started from the admin workspace.",
          details: {
            backupId: item.id,
            fileName: item.fileName,
          },
        })

        return jsonResponse({ item }, 201)
      },
    }),
    defineInternalRoute("/framework/database-backups/restore-drill", {
      method: "POST",
      summary: "Run a restore drill from a selected database backup.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const backupId = context.request.url.searchParams.get("id")

        if (!backupId) {
          throw new ApplicationError("Backup id is required.", {}, 400)
        }

        const run = await runDatabaseRestoreDrill(
          context.databases.primary,
          context.config,
          backupId
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "database-backup.restore-drill",
          message: "Database restore drill was executed from the admin workspace.",
          details: {
            backupId,
            runId: run.id,
          },
        })

        return jsonResponse({ item: run }, 201)
      },
    }),
    defineInternalRoute("/framework/database-backups/restore", {
      method: "POST",
      summary: "Restore the primary database from a selected backup and schedule restart.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const backupId = context.request.url.searchParams.get("id")

        if (!backupId) {
          throw new ApplicationError("Backup id is required.", {}, 400)
        }

        const run = await restoreDatabaseBackup(
          context.databases,
          context.config,
          backupId
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "database-backup.restore",
          level: "warn",
          message: "Live database restore was scheduled from the admin workspace.",
          details: {
            backupId,
            runId: run.id,
          },
        })

        return jsonResponse({ item: run }, 202)
      },
    }),
    defineInternalRoute("/framework/security-review", {
      summary: "Read the framework security review checklist and review history.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getSecurityReviewDashboard(context.databases.primary))
      },
    }),
    defineInternalRoute("/framework/security-review/item", {
      method: "POST",
      summary: "Update one security review checklist item.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const itemId = context.request.url.searchParams.get("id")

        if (!itemId) {
          throw new ApplicationError("Security review item id is required.", {}, 400)
        }

        const result = await updateSecurityReviewItem(
          context.databases.primary,
          itemId,
          context.request.jsonBody
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "security",
          action: "security-review.item-update",
          message: "Security review checklist item was updated from the admin workspace.",
          details: {
            itemId,
            status: result.item.status,
          },
        })

        return jsonResponse(result)
      },
    }),
    defineInternalRoute("/framework/security-review/complete", {
      method: "POST",
      summary: "Record a completed security review run.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const result = await completeSecurityReview(
          context.databases.primary,
          context.request.jsonBody
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "security",
          action: "security-review.complete",
          message: "Security review was completed from the admin workspace.",
          details: {
            runId: result.run.id,
            overallStatus: result.run.overallStatus,
          },
        })

        return jsonResponse(result, 201)
      },
    }),
    defineInternalRoute("/framework/media", {
      summary: "List framework-owned shared media assets.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listMedia(context.databases.primary))
      },
    }),
    defineInternalRoute("/framework/media", {
      method: "POST",
      summary: "Upload a new framework-owned media image asset.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await uploadMediaImage(
            context.databases.primary,
            context.config,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/framework/media-item", {
      summary: "Read one framework media asset by id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const mediaId = context.request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        return jsonResponse(await getMedia(context.databases.primary, mediaId))
      },
    }),
    defineInternalRoute("/framework/media-item", {
      method: "PATCH",
      summary: "Update framework media metadata.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const mediaId = context.request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        return jsonResponse(
          await updateMedia(
            context.databases.primary,
            context.config,
            mediaId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/framework/media-item", {
      method: "DELETE",
      summary: "Deactivate a framework media asset.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const mediaId = context.request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        return jsonResponse(await toggleMediaActive(context.databases.primary, mediaId, false))
      },
    }),
    defineInternalRoute("/framework/media-item/restore", {
      method: "POST",
      summary: "Restore a framework media asset.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const mediaId = context.request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        return jsonResponse(await toggleMediaActive(context.databases.primary, mediaId, true))
      },
    }),
    defineInternalRoute("/framework/media-file", {
      summary: "Serve an authenticated media file stream for framework-owned assets.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const mediaId = context.request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        const { item, content } = await readMediaContent(
          context.databases.primary,
          context.config,
          mediaId
        )

        return {
          statusCode: 200,
          headers: {
            "cache-control": "private, max-age=300",
            "content-type": item.mimeType,
          },
          body: content,
        }
      },
    }),
    defineInternalRoute("/framework/media-folders", {
      summary: "List framework-owned media folders.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listMediaFolders(context.databases.primary))
      },
    }),
    defineInternalRoute("/framework/media-folders", {
      method: "POST",
      summary: "Create a framework media folder.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createMediaFolder(context.databases.primary, context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/framework/media-folder", {
      method: "PATCH",
      summary: "Update a framework media folder.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const folderId = context.request.url.searchParams.get("id")

        if (!folderId) {
          throw new ApplicationError("Folder id is required.", {}, 400)
        }

        return jsonResponse(
          await updateMediaFolder(context.databases.primary, folderId, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/framework/media-folder", {
      method: "DELETE",
      summary: "Deactivate a framework media folder.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const folderId = context.request.url.searchParams.get("id")

        if (!folderId) {
          throw new ApplicationError("Folder id is required.", {}, 400)
        }

        return jsonResponse(
          await toggleMediaFolderActive(context.databases.primary, folderId, false)
        )
      },
    }),
    defineInternalRoute("/framework/media-folder/restore", {
      method: "POST",
      summary: "Restore a framework media folder.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const folderId = context.request.url.searchParams.get("id")

        if (!folderId) {
          throw new ApplicationError("Folder id is required.", {}, 400)
        }

        return jsonResponse(
          await toggleMediaFolderActive(context.databases.primary, folderId, true)
        )
      },
    }),
  ]
}
