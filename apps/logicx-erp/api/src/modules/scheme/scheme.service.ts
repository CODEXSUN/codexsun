import { AppError } from "@codexsun/framework/errors";
import type { LogicxErpSchemeRepository } from "./scheme.repository.js";
import type {
  LogicxErpSchemeFilters,
  LogicxErpSchemeInput,
  LogicxErpSchemeStatus,
  LogicxErpSchemeWrite
} from "./scheme.types.js";

type CurrentScheme = NonNullable<Awaited<ReturnType<LogicxErpSchemeRepository["findForWrite"]>>>;

export class LogicxErpSchemeService {
  constructor(private readonly repository: LogicxErpSchemeRepository) {}

  list(filters: LogicxErpSchemeFilters) {
    return this.repository.list({ ...filters, search: filters.search?.trim() });
  }

  async get(id: string) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Scheme was not found.");
    return record;
  }

  lookups() {
    return this.repository.lookups();
  }

  invoiceOptions(search: string) {
    return this.repository.invoiceOptions(search.trim());
  }

  async create(input: LogicxErpSchemeInput, actor: string) {
    const write = await this.resolve(input, null);
    return this.get(await this.repository.create(write, actor));
  }

  async update(id: string, input: LogicxErpSchemeInput, actor: string) {
    const current = await this.current(id);
    const write = await this.resolve(input, current);
    await this.repository.update(current.id, current.schemeNo, write, actor);
    return this.get(id);
  }

  async setStatus(id: string, status: LogicxErpSchemeStatus, actor: string) {
    const current = await this.current(id);
    if (current.status !== status)
      await this.repository.setStatus(current.id, current.schemeNo, status, actor);
    return this.get(id);
  }

  async remove(id: string, actor: string) {
    const record = await this.get(id);
    const current = await this.current(id);
    await this.repository.softDelete(current.id, current.schemeNo, actor);
    return record;
  }

  async activity(id: string) {
    const current = await this.current(id);
    return this.repository.activity(current.id);
  }

  private async current(id: string) {
    const current = await this.repository.findForWrite(id);
    if (!current) throw AppError.notFound("Scheme was not found.");
    return current;
  }

  // Existing references stay valid on edit even if the parent was later cancelled or
  // deactivated; new selections must point at usable parents.
  private async resolve(
    input: LogicxErpSchemeInput,
    current: CurrentScheme | null
  ): Promise<LogicxErpSchemeWrite> {
    const description = input.description.trim();
    if (!description) throw AppError.validation("Scheme description is required.");

    const sale = await this.repository.findSale(input.salesId);
    if (!sale || sale.deletedAt !== null)
      throw AppError.validation("Select a valid sales invoice.");
    if (sale.status === "cancelled" && sale.id !== current?.salesId)
      throw AppError.validation(
        `Sales invoice ${sale.invoiceNumber} is cancelled and cannot be used for a scheme.`
      );

    const brand = await this.repository.findBrand(input.brandId);
    if (!brand) throw AppError.validation("Select a valid brand.");
    if (brand.status !== "active" && brand.id !== current?.brandId)
      throw AppError.validation(`Brand ${brand.name} is inactive.`);

    await this.requireUser(input.requestedByUserId, current?.requestedByUserId, "Requested by");
    if (input.approvedByUserId !== null)
      await this.requireUser(input.approvedByUserId, current?.approvedByUserId, "Approved by");

    const { salesId: _salesId, ...rest } = input;
    return { ...rest, description, salesInternalId: sale.id };
  }

  private async requireUser(id: number, currentId: number | null | undefined, label: string) {
    const user = await this.repository.findUser(id);
    if (!user) throw AppError.validation(`${label} user was not found.`);
    if (user.status !== "active" && user.id !== currentId)
      throw AppError.validation(`${label} user ${user.name} is inactive.`);
  }
}
