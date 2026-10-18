import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { sql } from "kysely";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ClosureDatabase } from "./closure.types.js";

type Scope = {
  database: Kysely<ClosureDatabase>;
  actorEmail: string;
  actorUserId: number | null;
  canViewAll: boolean;
  canReview: boolean;
  workEvent?: (
    transaction: import("kysely").Transaction<ClosureDatabase>,
    enquiryId: number,
    action: string,
    body: string
  ) => Promise<void>;
};

const reference = z.coerce.number().int().positive();
const rowSchema = z.object({
  id: z.number().int().positive(),
  enquiryId: z.number().int().positive(),
  enquiryNo: z.number().int().positive(),
  title: z.string(),
  contact: z.string().nullable(),
  requester: z.string(),
  requestedAt: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  reviewNote: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable()
});

export function registerClosureRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<Scope>
) {
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/closure-requests",
    schemas: {
      params: z.object({ id: reference }),
      body: z.object({ note: z.string().trim().max(2000).default("") }),
      response: rowSchema
    },
    handler: async ({ params, body, request }) => {
      const scope = await context(request);
      const id = await scope.database.transaction().execute(async (trx) => {
        const enquiry = await trx
          .selectFrom("crm_enquiries")
          .select(["id", "assigned_user_id", "status_id", "created_by"])
          .where("id", "=", params.id)
          .forUpdate()
          .executeTakeFirst();
        if (!enquiry) throw AppError.notFound("Enquiry was not found.");
        if (
          !scope.canViewAll &&
          (scope.actorUserId == null || enquiry.assigned_user_id !== scope.actorUserId) &&
          enquiry.created_by.toLowerCase() !== scope.actorEmail.toLowerCase()
        ) {
          throw AppError.forbidden(
            "You can request closure only for an enquiry assigned to you or created by you."
          );
        }
        const status = await trx
          .selectFrom("crm_enquiry_statuses")
          .select("code")
          .where("id", "=", enquiry.status_id)
          .executeTakeFirst();
        if (!status || ["closed", "won", "lost"].includes(status.code)) {
          throw AppError.conflict("This enquiry is already in a terminal status.");
        }
        const pending = await trx
          .selectFrom("crm_closure_requests")
          .select("id")
          .where("enquiry_id", "=", enquiry.id)
          .where("status", "=", "pending")
          .executeTakeFirst();
        if (pending) throw AppError.conflict("A closure request is already waiting for review.");
        const inserted = await trx
          .insertInto("crm_closure_requests")
          .values({
            enquiry_id: enquiry.id,
            requested_by_user_id: scope.actorUserId,
            requested_by: scope.actorEmail,
            request_note: body.note || null,
            status: "pending",
            requested_at: sql`UTC_TIMESTAMP()`,
            created_at: sql`UTC_TIMESTAMP()`,
            updated_at: sql`UTC_TIMESTAMP()`
          })
          .executeTakeFirstOrThrow();
        await writeActivity(
          trx,
          enquiry.id,
          "closure-requested",
          body.note || "Closure requested and is waiting for verification.",
          scope.actorEmail
        );
        await scope.workEvent?.(
          trx,
          enquiry.id,
          "closure-requested",
          body.note || "Completion sent for approval."
        );
        return Number(inserted.insertId);
      });
      return loadRequest(scope.database, id);
    }
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/crm/closure-requests",
    schemas: {
      querystring: z.object({
        status: z.enum(["pending", "approved", "rejected"]).default("pending")
      }),
      response: z.object({ items: z.array(rowSchema) })
    },
    handler: async ({ query, request }) => {
      const scope = await context(request);
      requireReviewer(scope);
      const ids = await scope.database
        .selectFrom("crm_closure_requests")
        .select("id")
        .where("status", "=", query.status)
        .orderBy("requested_at", "desc")
        .limit(200)
        .execute();
      return { items: await Promise.all(ids.map((row) => loadRequest(scope.database, row.id))) };
    }
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/crm/enquiries/:id/closure-requests/latest",
    schemas: {
      params: z.object({ id: reference }),
      response: z.object({ item: rowSchema.nullable(), canReview: z.boolean() })
    },
    handler: async ({ params, request }) => {
      const scope = await context(request);
      const enquiry = await scope.database
        .selectFrom("crm_enquiries")
        .select(["assigned_user_id", "created_by"])
        .where("id", "=", params.id)
        .executeTakeFirst();
      if (!enquiry) throw AppError.notFound("Enquiry was not found.");
      if (
        !scope.canViewAll &&
        enquiry.assigned_user_id !== scope.actorUserId &&
        enquiry.created_by !== scope.actorEmail
      ) {
        throw AppError.forbidden("You cannot view closure requests for this enquiry.");
      }
      const latest = await scope.database
        .selectFrom("crm_closure_requests")
        .select("id")
        .where("enquiry_id", "=", params.id)
        .orderBy("requested_at", "desc")
        .limit(1)
        .executeTakeFirst();
      return {
        item: latest ? await loadRequest(scope.database, latest.id) : null,
        canReview: scope.canReview
      };
    }
  });

  registerContractRoute(app, {
    method: "PATCH",
    url: "/crm/closure-requests/:id/review",
    schemas: {
      params: z.object({ id: reference }),
      body: z.object({
        decision: z.enum(["approve", "reject"]),
        note: z.string().trim().max(2000).default("")
      }),
      response: rowSchema
    },
    handler: async ({ params, body, request }) => {
      const scope = await context(request);
      requireReviewer(scope);
      await scope.database.transaction().execute(async (trx) => {
        const current = await trx
          .selectFrom("crm_closure_requests")
          .selectAll()
          .where("id", "=", params.id)
          .forUpdate()
          .executeTakeFirst();
        if (!current) throw AppError.notFound("Closure request was not found.");
        if (current.status !== "pending") {
          throw AppError.conflict("This closure request has already been reviewed.");
        }
        if (body.decision === "approve") {
          const enquiry = await trx
            .selectFrom("crm_enquiries")
            .innerJoin("crm_enquiry_statuses", "crm_enquiry_statuses.id", "crm_enquiries.status_id")
            .select("crm_enquiry_statuses.code as code")
            .where("crm_enquiries.id", "=", current.enquiry_id)
            .forUpdate()
            .executeTakeFirst();
          if (!enquiry) throw AppError.notFound("Enquiry was not found.");
          if (["closed", "won", "lost"].includes(enquiry.code)) {
            throw AppError.conflict(
              "The enquiry has already moved to a terminal status. Reject this stale request instead."
            );
          }
          const runningJob = await trx
            .selectFrom("crm_enquiry_jobs")
            .select("id")
            .where("enquiry_id", "=", current.enquiry_id)
            .where("status", "=", "running")
            .executeTakeFirst();
          if (runningJob)
            throw AppError.conflict("Stop all running jobs before approving closure.");
          const checkpoint = await sql<{ id: number }>`SELECT w.id FROM crm_work_reports w
            WHERE w.enquiry_id=${current.enquiry_id} AND w.action='check-in'
            AND NOT EXISTS (SELECT 1 FROM crm_work_reports later WHERE later.enquiry_id=w.enquiry_id
              AND later.created_by=w.created_by AND later.action IN ('check-in','check-out') AND later.id>w.id)
            LIMIT 1`.execute(trx);
          if (checkpoint.rows.length)
            throw AppError.conflict("Check out all checked-in users before approving closure.");
          const closed = await trx
            .selectFrom("crm_enquiry_statuses")
            .select("id")
            .where("code", "=", "closed")
            .where("status", "=", "active")
            .executeTakeFirst();
          if (!closed) throw AppError.conflict("The active Closed status is not configured.");
          await trx
            .updateTable("crm_enquiries")
            .set({
              status_id: closed.id,
              closed_reason: current.request_note || "Closure approved",
              updated_at: sql`UTC_TIMESTAMP()`
            })
            .where("id", "=", current.enquiry_id)
            .execute();
        }
        await trx
          .updateTable("crm_closure_requests")
          .set({
            status: body.decision === "approve" ? "approved" : "rejected",
            reviewed_by: scope.actorEmail,
            review_note: body.note || null,
            reviewed_at: sql`UTC_TIMESTAMP()`,
            updated_at: sql`UTC_TIMESTAMP()`
          })
          .where("id", "=", current.id)
          .execute();
        await writeActivity(
          trx,
          current.enquiry_id,
          body.decision === "approve" ? "closure-approved" : "closure-rejected",
          body.note ||
            (body.decision === "approve" ? "Closure approved." : "Closure request rejected."),
          scope.actorEmail
        );
        await scope.workEvent?.(
          trx,
          current.enquiry_id,
          body.decision === "approve" ? "closure-approved" : "closure-rejected",
          body.note || (body.decision === "approve" ? "Verified and closed." : "Rework requested.")
        );
      });
      return loadRequest(scope.database, params.id);
    }
  });
}

function requireReviewer(scope: Scope) {
  if (!scope.canReview) throw AppError.forbidden("Closure review permission is required.");
}

async function writeActivity(
  database: Kysely<ClosureDatabase>,
  enquiryId: number,
  action: string,
  details: string,
  actor: string
) {
  await database
    .insertInto("crm_enquiry_activity")
    .values({
      enquiry_id: enquiryId,
      action,
      details,
      status: "active",
      created_by: actor,
      created_at: sql`UTC_TIMESTAMP()`,
      updated_at: sql`UTC_TIMESTAMP()`
    })
    .execute();
}

async function loadRequest(database: Kysely<ClosureDatabase>, id: number) {
  const result = await sql<{
    id: number;
    enquiryId: number;
    enquiryNo: number;
    title: string;
    contact: string | null;
    requester: string;
    requestedAt: Date | string;
    status: "pending" | "approved" | "rejected";
    reviewNote: string | null;
    reviewedBy: string | null;
    reviewedAt: Date | string | null;
  }>`
    SELECT request.id, enquiry.id AS enquiryId, enquiry.enquiry_no AS enquiryNo,
      enquiry.title, COALESCE(contact.name, enquiry.captured_name, enquiry.captured_phone) AS contact,
      request.requested_by AS requester, request.requested_at AS requestedAt,
      request.status, request.review_note AS reviewNote, request.reviewed_by AS reviewedBy,
      request.reviewed_at AS reviewedAt
    FROM crm_closure_requests AS request
    INNER JOIN crm_enquiries AS enquiry ON enquiry.id = request.enquiry_id
    LEFT JOIN core_contacts AS contact ON contact.id = enquiry.contact_id
    WHERE request.id = ${id}
  `.execute(database);
  const row = result.rows[0];
  if (!row) throw AppError.notFound("Closure request was not found.");
  return {
    ...row,
    requestedAt: new Date(row.requestedAt).toISOString(),
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null
  };
}
