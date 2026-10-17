import { dispatchKitchenPrint } from "./order.print-dispatch.js";
import { listKitchenPrinters } from "./order.printer.js";
import type { FastifyRequest } from "fastify";
import type { OrderDependencies, OrderInput } from "./order.types.js";
import { OrderRepository } from "./order.repository.js";
import { OrderKitchenRepository } from "./order.kitchen-repository.js";
export class OrderService {
  constructor(private readonly deps: OrderDependencies) {}
  async floorBills(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new OrderRepository(ctx.database).floorBills();
  }
  async printers(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.menu.view");
    return listKitchenPrinters();
  }
  async dispatch(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.kitchen.send");
    if (this.deps.kitchenPrinter)
      await dispatchKitchenPrint(
        ctx.database,
        await this.deps.kitchenPrinter(ctx.database),
        this.deps.printKitchenToken
      );
    return { accepted: true };
  }
  async kitchenQueue(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new OrderKitchenRepository(ctx.database).list();
  }
  async confirmKitchen(
    request: FastifyRequest,
    token: string,
    action: "ready" | "delivered",
    waiterUuid: string | null
  ) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize(action === "ready" ? "qcafe.kitchen.send" : "qcafe.pos.create");
    return new OrderKitchenRepository(ctx.database).confirm(
      token,
      action,
      waiterUuid,
      ctx.actorEmail,
      this.deps
    );
  }
  async list(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new OrderRepository(ctx.database).list();
  }
  async occupied(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new OrderRepository(ctx.database).occupied();
  }
  async get(request: FastifyRequest, uuid: string) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new OrderRepository(ctx.database).get(uuid);
  }
  async mutate(request: FastifyRequest, uuid: string, input: OrderInput) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.create");
    if (input.action === "kitchen" || input.action === "cancel")
      await ctx.authorize("qcafe.kitchen.send");
    const result = await new OrderRepository(ctx.database).mutate(
      uuid,
      input,
      ctx.actorEmail,
      this.deps
    );
    if (input.action === "kitchen" && input.mode === "KOT" && this.deps.kitchenPrinter)
      await dispatchKitchenPrint(
        ctx.database,
        await this.deps.kitchenPrinter(ctx.database),
        this.deps.printKitchenToken
      );
    return result;
  }
}
