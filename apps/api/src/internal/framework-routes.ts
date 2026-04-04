import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
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

        return jsonResponse(await runSystemUpdate(context.config, undefined, user.email))
      },
    }),
    defineInternalRoute("/framework/system-update/reset", {
      method: "POST",
      summary: "Force reset the git worktree to the current commit, clean local files, rebuild, and restart.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await resetSystemToLastCommit(
            context.config,
            context.request.jsonBody,
            undefined,
            user.email
          )
        )
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
