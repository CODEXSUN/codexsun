import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import { TableServiceRepository } from "../repository/table-service.repository.js";
export class TableServiceConflictError extends Error {}
export class TableServiceService {
  constructor(
    private repo: TableServiceRepository,
    private activity: ActivityRecorder,
    private orderClosed: (id: string) => Promise<boolean>,
    private now: () => Date = () => new Date(),
  ) {}
  read(businessId: string, locationId: string) {
    return this.repo.workspace(businessId, locationId);
  }
  async area(
    input: {
      businessId: string;
      locationId: string;
      name: string;
      kind: "dining" | "bar" | "terrace" | "private";
      sortOrder: number;
    },
    context: CommandContext,
  ) {
    if (!(await this.repo.location(input.businessId, input.locationId)))
      throw new TableServiceConflictError("The outlet is invalid.");
    const id = await this.repo.area(input, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.booking.area.created",
      subjectId: id,
      subjectType: "dining-area",
    });
    return this.read(input.businessId, input.locationId);
  }
  async table(
    input: {
      businessId: string;
      locationId: string;
      areaId: string;
      code: string;
      capacity: number;
      positionLabel?: string;
    },
    context: CommandContext,
  ) {
    if (
      !(await this.repo.location(input.businessId, input.locationId)) ||
      !(await this.repo.areaAtLocation(input.areaId, input.locationId))
    )
      throw new TableServiceConflictError("The table area is invalid for this outlet.");
    try {
      const id = await this.repo.table(input, this.now().toISOString());
      await this.activity.record(context, {
        eventType: "qcafe.booking.table.created",
        subjectId: id,
        subjectType: "dining-table",
      });
      return this.read(input.businessId, input.locationId);
    } catch {
      throw new TableServiceConflictError("The table code or area is invalid.");
    }
  }
  async open(
    input: { businessId: string; locationId: string; tableIds: string[]; guestCount: number },
    context: CommandContext,
  ) {
    await this.openSession(input, context);
    return this.read(input.businessId, input.locationId);
  }
  async openSession(
    input: { businessId: string; locationId: string; tableIds: string[]; guestCount: number },
    context: CommandContext,
  ) {
    if (
      !(await this.repo.location(input.businessId, input.locationId)) ||
      !(await this.repo.tablesAtLocation(input.tableIds, input.locationId))
    )
      throw new TableServiceConflictError("One or more selected tables are invalid for this outlet.");
    try {
      const id = await this.repo.open(
        input.locationId,
        input.tableIds,
        input.guestCount,
        context.actorId,
        this.now().toISOString(),
      );
      await this.activity.record(context, {
        eventType: "qcafe.booking.table-session.opened",
        subjectId: id,
        subjectType: "table-session",
      });
      return id;
    } catch {
      throw new TableServiceConflictError("One or more selected tables are already occupied or invalid.");
    }
  }
  async releaseEmptySession(id: string, context: CommandContext) {
    const session = await this.repo.session(id);
    if (session?.status === "open" && !session.primary_order_id)
      await this.repo.close(id, context.actorId, this.now().toISOString());
  }
  async close(id: string, context: CommandContext) {
    const session = await this.repo.session(id);
    if (!session || session.status !== "open") throw new TableServiceConflictError("Open table session not found.");
    if (session.primary_order_id && !(await this.orderClosed(session.primary_order_id)))
      throw new TableServiceConflictError(
        "The linked order must be fulfilled or cancelled before the table is released.",
      );
    await this.repo.close(id, context.actorId, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.booking.table-session.closed",
      subjectId: id,
      subjectType: "table-session",
    });
    const businessId = await this.repo.businessId(session.location_id);
    if (!businessId) throw new TableServiceConflictError("The session outlet no longer exists.");
    return this.read(businessId, session.location_id);
  }
}
