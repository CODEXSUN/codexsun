import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type {
  PosDependencies,
  PosInput,
  PosLine,
  PosMenuOption,
  PaymentInput
} from "./pos.types.js";
import { PosRepository } from "./pos.repository.js";

export class PosService {
  constructor(private readonly dependencies: PosDependencies) {}

  async list(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.pos.view");
    return new PosRepository(context.database).list();
  }

  async get(request: FastifyRequest, uuid: string) {
    const ctx = await this.dependencies.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new PosRepository(ctx.database).get(uuid);
  }
  async create(request: FastifyRequest, input: PosInput) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.pos.create");
    const replay = await new PosRepository(context.database).replayRequest(
      input.requestId,
      digest(input)
    );
    if (replay) return replay;
    const menu = await this.dependencies.lookupMenu(
      context.database,
      input.lines.map((line) => line.menuUuid)
    );
    const lines = pricePosLines(input, menu);
    return new PosRepository(context.database).create(
      input.requestId,
      digest(input),
      lines,
      context.actorEmail
    );
  }

  async pay(request: FastifyRequest, uuid: string, input: PaymentInput) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.pos.pay");
    return new PosRepository(context.database).pay(
      uuid,
      input,
      digest({ uuid, ...input }),
      context.actorEmail,
      this.dependencies.releaseSeats
    );
  }
}

export function pricePosLines(input: PosInput, menu: PosMenuOption[]): PosLine[] {
  const seen = new Set<string>();
  const lines = input.lines.map((line) => {
    if (seen.has(line.menuUuid))
      throw AppError.validation("Combine duplicate menu items into one line.");
    seen.add(line.menuUuid);
    const item = menu.find((candidate) => candidate.uuid === line.menuUuid);
    if (!item)
      throw AppError.validation("A menu item is inactive or unavailable. Refresh the menu.");
    const amount = Math.round(item.price * line.quantity);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000)
      throw AppError.validation("Line amount is out of range.");
    return {
      menuUuid: item.uuid,
      code: item.code,
      name: item.name,
      quantity: line.quantity,
      rate: item.price,
      amount
    };
  });
  if (lines.reduce((sum, line) => sum + line.amount, 0) > 100_000_000)
    throw AppError.validation("Bill total is out of range.");
  return lines;
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
