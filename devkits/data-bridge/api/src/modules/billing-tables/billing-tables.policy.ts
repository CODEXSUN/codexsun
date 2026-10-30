const runtimeTables = new Set([
  "billing_dashboard_snapshots",
  "billing_domain_events",
  "billing_outbox_jobs",
  "billing_opening_balance_legacy_assignments"
]);

export function billingTableNames(names: string[]) {
  return names
    .filter(
      (name) =>
        name.startsWith("billing_") &&
        !runtimeTables.has(name) &&
        !/_(activities|compliance_jobs|entry_tools)$/u.test(name)
    )
    .sort();
}

export const billingInvoiceTables = ["billing_sales", "billing_export_sales"] as const;
