import { createAuthService, createMailboxService } from "../../../core/src/services/service-factory.js"
import { getAppSettingsSnapshot } from "../../../core/src/services/auth-option-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createCoreAuthInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/core/auth/users", {
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
    defineInternalRoute("/core/auth/user", {
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
    defineInternalRoute("/core/auth/users", {
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
    defineInternalRoute("/core/auth/user", {
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
    defineInternalRoute("/core/auth/roles", {
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
    defineInternalRoute("/core/auth/role", {
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
    defineInternalRoute("/core/auth/roles", {
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
    defineInternalRoute("/core/auth/role", {
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
    defineInternalRoute("/core/auth/permissions", {
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
    defineInternalRoute("/core/auth/metadata", {
      summary: "List DB-backed auth option metadata for actor types, scopes, actions, apps, and resources.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(await getAppSettingsSnapshot(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/auth/permission", {
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
    defineInternalRoute("/core/auth/permissions", {
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
    defineInternalRoute("/core/auth/permission", {
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
    defineInternalRoute("/core/auth/sessions", {
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
    defineInternalRoute("/core/mailbox/templates", {
      summary: "List mailbox templates for the core app.",
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
    defineInternalRoute("/core/mailbox/template", {
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
    defineInternalRoute("/core/mailbox/template", {
      method: "POST",
      summary: "Create a mailbox template in the core app.",
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
    defineInternalRoute("/core/mailbox/template", {
      method: "PATCH",
      summary: "Update an existing mailbox template in the core app.",
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
    defineInternalRoute("/core/mailbox/template", {
      method: "DELETE",
      summary: "Deactivate a mailbox template in the core app.",
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
    defineInternalRoute("/core/mailbox/template/restore", {
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
    defineInternalRoute("/core/mailbox/messages", {
      summary: "List mailbox messages generated by auth and manual sends.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createMailboxService(
            context.databases.primary,
            context.config
          ).listMessages()
        )
      },
    }),
    defineInternalRoute("/core/mailbox/message", {
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
    defineInternalRoute("/core/mailbox/message/send", {
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
