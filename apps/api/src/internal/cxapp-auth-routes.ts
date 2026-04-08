import { createAuthService, createMailboxService } from "../../../cxapp/src/services/service-factory.js"
import { getAppSettingsSnapshot } from "../../../cxapp/src/services/auth-option-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createCxappAuthInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/cxapp/auth/users", {
      summary: "List app-owned auth users for admin review.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).listUsers()
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/user", {
      summary: "Read one authenticated user record for admin management.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const userId = context.request.url.searchParams.get("id")

        if (!userId) {
          throw new ApplicationError("User id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).getUser(userId)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/users", {
      method: "POST",
      summary: "Create an authenticated user from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).createAdminUser(context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/user", {
      method: "PATCH",
      summary: "Update an authenticated user from the admin workspace.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const userId = context.request.url.searchParams.get("id")

        if (!userId) {
          throw new ApplicationError("User id is required.", {}, 400)
        }

        if (user.id === userId && context.request.jsonBody && typeof context.request.jsonBody === "object") {
          const nextBody = context.request.jsonBody as { isActive?: boolean }

          if (nextBody.isActive === false) {
            throw new ApplicationError(
              "You cannot deactivate the current signed-in admin account.",
              { userId },
              409
            )
          }
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).updateAdminUser(userId, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/user", {
      method: "DELETE",
      summary: "Permanently delete an authenticated user from the admin workspace.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const userId = context.request.url.searchParams.get("id")

        if (!userId) {
          throw new ApplicationError("User id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).deleteAdminUser({
            actingUser: user,
            userId,
          })
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/roles", {
      summary: "List RBAC roles with permissions and assignment counts.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).listRoles()
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/role", {
      summary: "Read one RBAC role for admin management.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const roleId = context.request.url.searchParams.get("id")

        if (!roleId) {
          throw new ApplicationError("Role id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).getRole(roleId)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/roles", {
      method: "POST",
      summary: "Create an RBAC role from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).createRole(context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/role", {
      method: "PATCH",
      summary: "Update an RBAC role from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const roleId = context.request.url.searchParams.get("id")

        if (!roleId) {
          throw new ApplicationError("Role id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).updateRole(roleId, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/permissions", {
      summary: "List RBAC permissions for role management.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).listPermissions()
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/metadata", {
      summary: "List DB-backed auth option metadata for actor types, scopes, actions, apps, and resources.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getAppSettingsSnapshot(context.databases.primary))
      },
    }),
    defineInternalRoute("/cxapp/auth/permission", {
      summary: "Read one permission for admin management.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const permissionId = context.request.url.searchParams.get("id")

        if (!permissionId) {
          throw new ApplicationError("Permission id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).getPermission(permissionId)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/permissions", {
      method: "POST",
      summary: "Create a permission from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).createPermission(context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/permission", {
      method: "PATCH",
      summary: "Update a permission from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })
        const permissionId = context.request.url.searchParams.get("id")

        if (!permissionId) {
          throw new ApplicationError("Permission id is required.", {}, 400)
        }

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).updatePermission(permissionId, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/auth/sessions", {
      summary: "List active and historical auth sessions for admin review.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createAuthService(
            context.databases.primary,
            context.config
          ).listSessions()
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/templates", {
      summary: "List mailbox templates for cxapp.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).listTemplates(context.request.url.searchParams.get("includeInactive") !== "false")
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/template", {
      summary: "Resolve a mailbox template by id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox template id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).getTemplateById(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/template", {
      method: "POST",
      summary: "Create a mailbox template in cxapp.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).createTemplate(context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/template", {
      method: "PATCH",
      summary: "Update an existing mailbox template in cxapp.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox template id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).updateTemplate(id, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/template", {
      method: "DELETE",
      summary: "Deactivate a mailbox template in cxapp.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox template id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).deactivateTemplate(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/template/restore", {
      method: "POST",
      summary: "Restore a previously deactivated mailbox template.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox template id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).restoreTemplate(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/messages", {
      summary: "List mailbox messages generated by auth and manual sends.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).listMessages({
            archived: context.request.url.searchParams.get("archived") === "true",
          })
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/message", {
      summary: "Resolve a mailbox message by id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox message id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).getMessageById(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/message", {
      method: "DELETE",
      summary: "Delete one mailbox message from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox message id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).deleteMessage(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/message/archive", {
      method: "POST",
      summary: "Archive one mailbox message from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox message id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).archiveMessage(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/message/restore", {
      method: "POST",
      summary: "Restore one archived mailbox message back to the inbox.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const id = context.request.url.searchParams.get("id")

        if (!id) {
          throw new ApplicationError("Mailbox message id is required.", {}, 400)
        }

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).restoreMessage(id)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/messages/delete", {
      method: "POST",
      summary: "Bulk delete mailbox messages from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).deleteMessages(context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/messages/archive", {
      method: "POST",
      summary: "Bulk archive mailbox messages from the admin workspace.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).archiveMessages(context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/messages/restore", {
      method: "POST",
      summary: "Bulk restore archived mailbox messages back to the inbox.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).restoreMessages(context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/cxapp/mailbox/message/send", {
      method: "POST",
      summary: "Send a manual mailbox message through the configured provider.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).send(context.request.jsonBody),
          201
        )
      },
    }),
  ]
}
