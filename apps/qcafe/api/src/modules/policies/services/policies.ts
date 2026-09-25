import { authorize, type Actor } from "@codexsun/platform-core";

export const OPERATIONAL_ROLES = ["cashier", "waiter", "kitchen", "manager", "owner"] as const;

export type OperationalRole = (typeof OPERATIONAL_ROLES)[number];

export const QCAFE_PERMISSIONS = [
  "qcafe.pos.sell",
  "qcafe.pos.discount",
  "qcafe.kitchen.operate",
  "qcafe.booking.manage",
  "qcafe.billing.bill",
  "qcafe.billing.refund",
  "qcafe.billing.voucher",
  "qcafe.cash.move",
  "qcafe.cash.settle",
  "qcafe.day.close",
  "qcafe.inventory.adjust",
  "qcafe.inventory.count",
  "qcafe.documents.print",
  "qcafe.documents.deliver",
  "qcafe.reports.view",
  "qcafe.settings.manage",
] as const;

export type QcafePermission = (typeof QCAFE_PERMISSIONS)[number];

const SELL: QcafePermission[] = ["qcafe.pos.sell", "qcafe.documents.print"];

export const ROLE_POLICIES: Record<OperationalRole, readonly QcafePermission[]> = {
  cashier: [...SELL, "qcafe.pos.discount", "qcafe.billing.bill"],
  waiter: [...SELL, "qcafe.booking.manage"],
  kitchen: ["qcafe.kitchen.operate", "qcafe.documents.print"],
  manager: [
    ...SELL,
    "qcafe.pos.discount",
    "qcafe.kitchen.operate",
    "qcafe.booking.manage",
    "qcafe.billing.bill",
    "qcafe.billing.refund",
    "qcafe.billing.voucher",
    "qcafe.cash.move",
    "qcafe.cash.settle",
    "qcafe.day.close",
    "qcafe.inventory.adjust",
    "qcafe.inventory.count",
    "qcafe.documents.deliver",
    "qcafe.reports.view",
  ],
  owner: [...QCAFE_PERMISSIONS],
};

export class PolicyDeniedError extends Error {
  readonly missingPermissions: readonly string[];

  constructor(missingPermissions: readonly string[]) {
    super(`Missing permissions: ${missingPermissions.join(", ")}.`);
    this.missingPermissions = missingPermissions;
  }
}

export function permissionsForRoles(roles: readonly string[]): string[] {
  const granted = new Set<string>();
  for (const role of roles) {
    for (const permission of ROLE_POLICIES[role as OperationalRole] ?? []) granted.add(permission);
  }
  return [...granted];
}

export function assertPolicy(actor: Actor | undefined, permission: QcafePermission): void {
  if (!actor) throw new PolicyDeniedError([permission]);
  const effective: Actor = { ...actor, permissions: [...actor.permissions, ...permissionsForRoles(actor.roles)] };
  const decision = authorize(effective, { permissions: [permission] });
  if (!decision.allowed) throw new PolicyDeniedError([...decision.missingPermissions]);
}
