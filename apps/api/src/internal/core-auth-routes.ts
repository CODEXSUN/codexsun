import { createAuthService, createMailboxService } from "../../../core/src/services/service-factory.js"
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
