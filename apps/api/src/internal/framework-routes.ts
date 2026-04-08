import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
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
  getSystemUpdateStatus,
  listSystemUpdateHistory,
  resetSystemToLastCommit,
  runSystemUpdate,
} from "../../../framework/src/runtime/system-update/system-update-service.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createFrameworkInternalRoutes(): HttpRouteDefinition[] {
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

        return jsonResponse(listSystemUpdateHistory(context.config))
      },
    }),
    defineInternalRoute("/framework/system-update", {
      method: "POST",
      summary: "Fetch latest tracked git commit, build the suite, and restart when the worktree is clean.",
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
      summary: "Force reset the git worktree to the current commit, clean local files, rebuild, and restart.",
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
