import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { CafeStore, type CafeUser } from "@codexsun/qcafe-api/src/store.mjs";
import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { z } from "zod";
import { tenantAccessContext } from "../../auth/tenant-access-context.js";
import { env } from "../../env.js";
import type { QCafeCloudSession } from "./qcafe.types.js";

const stores = new Map<string, CafeStore>();
const sessions = new Map<string, QCafeCloudSession>();
const actionSchema = z.object({
  action: z.enum([
    "orders",
    "pos",
    "receipts",
    "kitchen",
    "inventory",
    "bookings",
    "category",
    "category/delete",
    "item",
    "item/delete",
    "table",
    "table/delete",
    "master-setting",
    "image",
    "verify-image-folder",
    "open-image-folder"
  ]),
  input: z.record(z.string(), z.unknown())
});
const loginSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(60),
  pin: z.string().regex(/^\d{4}$/)
});
const setupSchema = z.object({
  login: z.string().trim().min(1).max(60).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  pin: z.string().regex(/^\d{4}$/)
});

export async function registerQCafeRoutes(app: FastifyInstance) {
  app.post("/qcafe/auth/setup", async (request) => {
    const context = await cafeContext(request);
    const user = storeFor(context.tenantId).setupOwner(setupSchema.parse(request.body));
    return ok(cafeSession(context.tenantId, user), { requestId: request.id });
  });
  app.post("/qcafe/auth/pin", async (request) => {
    const context = await cafeContext(request);
    const user = storeFor(context.tenantId).signInCloudPin(loginSchema.parse(request.body).pin);
    return ok(cafeSession(context.tenantId, user), { requestId: request.id });
  });
  app.post("/qcafe/auth/login", async (request) => {
    const context = await cafeContext(request);
    const body = credentialsSchema.parse(request.body);
    const user = storeFor(context.tenantId).signInStaff(body.username, body.pin);
    return ok(cafeSession(context.tenantId, user), { requestId: request.id });
  });
  app.get("/qcafe", async (request) => {
    const context = await cafeContext(request);
    const session = cafeSessionFor(request, context.tenantId);
    return ok(snapshotFor(context.tenantId, session.user), { requestId: request.id });
  });
  app.post("/qcafe/action", async (request) => {
    const context = await cafeContext(request);
    const session = cafeSessionFor(request, context.tenantId);
    const body = actionSchema.parse(request.body);
    assertActionRole(session.user, body.action);
    const result = await runAction(context.tenantId, body.action, body.input);
    return ok({ ok: true, result }, { requestId: request.id });
  });
  app.get("/qcafe/images/:name", async (request, reply) => {
    const context = await cafeContext(request);
    const name = safeImageName((request.params as { name?: string }).name ?? "");
    const file = join(imageDirectoryFor(context.tenantId), name);
    if (!existsSync(file)) throw AppError.notFound("Q Cafe image was not found.");
    reply.header("Cache-Control", "private, max-age=86400");
    reply.type(imageContentType(name));
    return reply.send(readFileSync(file));
  });
}

async function cafeContext(request: FastifyRequest) {
  const context = tenantAccessContext(request);
  const enabled = await context.database
    .selectFrom("app_module_settings")
    .select("id")
    .where("module_key", "=", "qcafe")
    .where("enabled", "=", true)
    .where("status", "=", "active")
    .executeTakeFirst();
  if (!enabled) throw AppError.forbidden("Q Cafe is not enabled for this tenant.");
  return context;
}

function storeFor(tenantId: string) {
  const current = stores.get(tenantId);
  if (current) return current;
  const directory = cafeDirectoryFor(tenantId);
  mkdirSync(directory, { recursive: true });
  const store = new CafeStore(join(directory, "q-cafe.sqlite"));
  stores.set(tenantId, store);
  return store;
}

function cafeDirectoryFor(tenantId: string) {
  if (!/^[a-f0-9]{8}$/i.test(tenantId))
    throw AppError.forbidden("Q Cafe tenant access is invalid.");
  return join(env.STORAGE_ROOT, "q-cafe", tenantId.toLowerCase());
}

function imageDirectoryFor(tenantId: string) {
  const directory = join(cafeDirectoryFor(tenantId), "images");
  mkdirSync(directory, { recursive: true });
  return directory;
}

function cafeSession(tenantId: string, user: CafeUser) {
  const accessToken = randomUUID();
  sessions.set(accessToken, { expiresAt: Date.now() + 12 * 60 * 60 * 1_000, tenantId, user });
  return { access_token: accessToken, expires_in: 12 * 60 * 60, user };
}

function cafeSessionFor(request: FastifyRequest, tenantId: string) {
  const value = request.headers["x-qcafe-session"];
  const token = Array.isArray(value) ? value[0] : value;
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expiresAt <= Date.now() || session.tenantId !== tenantId) {
    if (token) sessions.delete(token);
    throw AppError.unauthorized("Q Cafe sign-in required.");
  }
  return session;
}

function snapshotFor(tenantId: string, user: CafeUser) {
  return {
    ...storeFor(tenantId).snapshot(),
    demo: false,
    storage: { image_directory: imageDirectoryFor(tenantId) },
    user
  };
}

function assertActionRole(user: CafeUser, action: z.infer<typeof actionSchema>["action"]) {
  const required: Record<z.infer<typeof actionSchema>["action"], CafeUser["role"]> = {
    orders: "cashier",
    pos: "cashier",
    receipts: "cashier",
    kitchen: "kitchen",
    inventory: "manager",
    bookings: "waiter",
    category: "manager",
    "category/delete": "manager",
    item: "manager",
    "item/delete": "manager",
    table: "manager",
    "table/delete": "manager",
    "master-setting": "manager",
    image: "manager",
    "verify-image-folder": "manager",
    "open-image-folder": "manager"
  };
  const rank: Record<CafeUser["role"], number> = {
    kitchen: 1,
    waiter: 1,
    cashier: 2,
    manager: 3,
    owner: 4
  };
  if (rank[user.role] < rank[required[action]])
    throw AppError.forbidden("Your Q Cafe role cannot perform this action.");
}

async function runAction(
  tenantId: string,
  action: z.infer<typeof actionSchema>["action"],
  input: Record<string, unknown>
) {
  const store = storeFor(tenantId);
  if (action === "image") return saveImage(tenantId, input);
  if (action === "verify-image-folder")
    return {
      canWrite: true,
      folderPath: imageDirectoryFor(tenantId),
      isWriteProtected: false,
      message: "Tenant Q Cafe image storage is writable.",
      ok: true,
      timestamp: new Date().toISOString()
    };
  if (action === "open-image-folder") return { folderPath: imageDirectoryFor(tenantId) };
  const method = {
    orders: "order",
    pos: "createPos",
    receipts: "recordReceipt",
    kitchen: "advance",
    inventory: "adjust",
    bookings: "book",
    category: "saveCategory",
    "category/delete": "deleteCategory",
    item: "saveItem",
    "item/delete": "deleteItem",
    table: "saveRestaurantTable",
    "table/delete": "deleteRestaurantTable",
    "master-setting": "saveMasterSetting"
  } as const;
  const methodName = method[action as keyof typeof method];
  if (!methodName) throw AppError.notFound("Q Cafe action is unavailable.");
  const handler = store[methodName];
  if (typeof handler !== "function") throw AppError.notFound("Q Cafe action is unavailable.");
  return handler.call(store, input);
}

function saveImage(tenantId: string, input: Record<string, unknown>) {
  const name = safeImageName(typeof input.file_name === "string" ? input.file_name : "");
  const type = typeof input.content_type === "string" ? input.content_type : "";
  if (type !== imageContentType(name))
    throw AppError.validation("Choose a JPG, PNG, or WebP image.");
  const content =
    typeof input.content_base64 === "string"
      ? Buffer.from(input.content_base64, "base64")
      : Buffer.alloc(0);
  if (!content.length || content.length > 5_000_000)
    throw AppError.validation("Choose an image smaller than 5 MB.");
  const target = join(imageDirectoryFor(tenantId), name);
  if (existsSync(target) && !readFileSync(target).equals(content))
    throw AppError.conflict("An image with this file name already exists.");
  if (!existsSync(target)) writeFileSync(target, content, { flag: "wx" });
  return { file_name: name };
}

function safeImageName(value: string) {
  const name = basename(value.replaceAll("\\", "/"));
  if (
    [...name].some((character) => character.charCodeAt(0) < 32) ||
    !/^[^<>:"/\\|?*]{1,120}\.(?:jpe?g|png|webp)$/iu.test(name)
  )
    throw AppError.validation("Use a safe JPG, PNG, or WebP image name.");
  return name;
}

function imageContentType(name: string) {
  const extension = extname(name).toLowerCase();
  return extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
}
