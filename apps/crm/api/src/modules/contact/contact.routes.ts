import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { CrmContactService } from "./contact.service.js";
import type { CrmContactLookupName } from "./contact.types.js";

const base = "/crm/contacts";
const response = z.unknown();
const idParams = z.object({ id: z.string().regex(/^\d+$/u) });
const addressParams = idParams.extend({ addressId: z.string().regex(/^\d+$/u) });
const searchQuery = z.object({ search: z.string().trim().optional() });
const body = z.unknown();
const contactSaveBody = z
  .object({
    phones: z
      .array(
        z
          .object({
            phone: z.string().trim().min(1),
            phoneType: z.string().trim().min(1),
            isPrimary: z.boolean()
          })
          .passthrough()
      )
      .superRefine((phones, context) => {
        const mobiles = phones.filter((phone) => ["Mobile", "WhatsApp"].includes(phone.phoneType));
        if (!mobiles.length)
          context.addIssue({ code: "custom", message: "Add at least one mobile number." });
        for (const [index, phone] of phones.entries()) {
          if (mobiles.includes(phone) && !/^\d{10}$/.test(phone.phone))
            context.addIssue({
              code: "custom",
              path: [index, "phone"],
              message: "Enter a 10-digit mobile number."
            });
          if (phones.slice(0, index).some((other) => other.phone === phone.phone))
            context.addIssue({
              code: "custom",
              path: [index, "phone"],
              message: "This number is already added to this customer."
            });
        }
        if (phones.filter((phone) => phone.isPrimary).length !== 1)
          context.addIssue({ code: "custom", message: "Choose one primary phone number." });
      })
  })
  .passthrough();
const lookups: readonly (readonly [CrmContactLookupName, string, string])[] = [
  ["contactTypes", "contact-types", "/core/common/contacts/contact-types"],
  ["contactGroups", "contact-groups", "/core/common/contacts/contact-groups"],
  ["addressTypes", "address-types", "/core/common/contacts/address-types"],
  ["bankNames", "bank-names", "/core/common/contacts/bank-names"],
  ["countries", "countries", "/core/common/location/countries"],
  ["states", "states", "/core/common/location/states"],
  ["districts", "districts", "/core/common/location/districts"],
  ["cities", "cities", "/core/common/location/cities"],
  ["pincodes", "pincodes", "/core/common/location/pincodes"]
] as const;

export function registerCrmContactRoutes(
  app: FastifyInstance,
  authorize: (request: FastifyRequest) => Promise<void>,
  onSaved?: (request: FastifyRequest, id: number) => Promise<void>
) {
  const service = new CrmContactService(app);
  const preHandler = async (request: FastifyRequest) => authorize(request);
  const saved = async (request: FastifyRequest, value: unknown) => {
    const identity = z.object({ id: z.coerce.number().int().positive() }).safeParse(value);
    if (identity.success && onSaved) {
      try { await onSaved(request, identity.data.id); }
      catch (error) { request.log.warn({ error, contactId: identity.data.id }, "Contact saved; sync dispatch deferred to recovery."); }
    }
    return value;
  };
  registerContractRoute(app, {
    handler: ({ query, request }) =>
      service.forward(
        request,
        "GET",
        `${CORE_CONTACTS}${query.search ? `?search=${encodeURIComponent(query.search)}` : ""}`
      ),
    method: "GET",
    preHandler,
    schemas: { querystring: searchQuery, response },
    url: base
  });
  registerContractRoute(app, {
    handler: async ({ body: input, request }) => saved(request, await service.forward(request, "POST", CORE_CONTACTS, input)),
    method: "POST",
    preHandler,
    schemas: { body: contactSaveBody, response },
    url: base
  });
  registerContractRoute(app, {
    handler: ({ request }) => service.forward(request, "GET", `${CORE_CONTACTS}/next-code`),
    method: "GET",
    preHandler,
    schemas: { response },
    url: `${base}/next-code`
  });
  registerContractRoute(app, {
    handler: ({ params, request }) =>
      service.forward(request, "GET", `${CORE_CONTACTS}/${params.id}`),
    method: "GET",
    preHandler,
    schemas: { params: idParams, response },
    url: `${base}/:id`
  });
  registerContractRoute(app, {
    handler: async ({ body: input, params, request }) =>
      saved(request, await service.forward(request, "PUT", `${CORE_CONTACTS}/${params.id}`, input)),
    method: "PUT",
    preHandler,
    schemas: { body: contactSaveBody, params: idParams, response },
    url: `${base}/:id`
  });
  registerContractRoute(app, {
    handler: ({ body: input, params, request }) =>
      service.forward(request, "POST", `${CORE_CONTACTS}/${params.id}/addresses`, input),
    method: "POST",
    preHandler,
    schemas: { body, params: idParams, response },
    url: `${base}/:id/addresses`
  });
  registerContractRoute(app, {
    handler: ({ body: input, params, request }) =>
      service.forward(
        request,
        "PUT",
        `${CORE_CONTACTS}/${params.id}/addresses/${params.addressId}`,
        input
      ),
    method: "PUT",
    preHandler,
    schemas: { body, params: addressParams, response },
    url: `${base}/:id/addresses/:addressId`
  });
  for (const [action, method] of [
    ["activate", "POST"],
    ["deactivate", "POST"],
    ["force", "DELETE"]
  ] as const) {
    registerContractRoute(app, {
      handler: ({ params, request }) =>
        service.forward(request, method, `${CORE_CONTACTS}/${params.id}/${action}`),
      method,
      preHandler,
      schemas: { params: idParams, response },
      url: `${base}/:id/${action}`
    });
  }
  registerContractRoute(app, {
    handler: async ({ request }) => {
      const entries = await Promise.all(
        lookups.map(
          async ([key, , corePath]) =>
            [key, await service.forward(request, "GET", corePath)] as const
        )
      );
      return Object.fromEntries(entries);
    },
    method: "GET",
    preHandler,
    schemas: { response },
    url: `${base}/lookups`
  });
  for (const [, pathName, corePath] of lookups) {
    registerContractRoute(app, {
      handler: ({ body: input, request }) => service.forward(request, "POST", corePath, input),
      method: "POST",
      preHandler,
      schemas: { body, response },
      url: `${base}/lookups/${pathName}`
    });
  }
}

const CORE_CONTACTS = "/core/master/contacts";
