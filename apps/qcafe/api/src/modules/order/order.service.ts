import type { FastifyRequest } from "fastify";
import type { OrderDependencies, OrderInput } from "./order.types.js";
import { OrderRepository } from "./order.repository.js";
export class OrderService {
  constructor(private readonly deps: OrderDependencies) {}
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
    return new OrderRepository(ctx.database).mutate(uuid, input, ctx.actorEmail, this.deps);
  }
}
