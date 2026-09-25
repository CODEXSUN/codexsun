import type { FastifyInstance } from "fastify";
import { z } from "zod";

const qcafePageIdSchema = z.enum([
  "overview",
  "setup",
  "menu",
  "pos",
  "kot",
  "booking",
  "billing",
  "inventory",
  "documents",
  "backup",
  "sync",
  "marketplace",
  "accounting",
  "reports",
]);

const qcafeWorkspacePageSchema = z.object({
  description: z.string(),
  id: qcafePageIdSchema,
  label: z.string(),
  status: z.string(),
  title: z.string(),
});

const qcafeWorkspaceResponseSchema = z.object({
  pages: z.array(qcafeWorkspacePageSchema),
  providers: z.array(z.string()),
  status: z.literal("ok"),
});

export type QcafeWorkspacePage = z.infer<typeof qcafeWorkspacePageSchema>;

const qcafeWorkspacePages: QcafeWorkspacePage[] = [
  {
    description: "Review restaurant sales, live service, kitchen load, and bookings from one desk.",
    id: "overview",
    label: "Overview",
    status: "Ready for first setup",
    title: "Restaurant overview",
  },
  {
    description:
      "Set the business, outlets, service channels, business days, and document sequences before restaurant service starts.",
    id: "setup",
    label: "Business setup",
    status: "Foundation module",
    title: "Business and location setup",
  },
  {
    description: "Maintain categories, sale items, variants, price books, and outlet or service-channel prices.",
    id: "menu",
    label: "Menu setup",
    status: "Menu module",
    title: "Menu and pricing",
  },
  {
    description: "Build the touch-first order screen for dine-in, takeaway, delivery, and counter sales.",
    id: "pos",
    label: "POS",
    status: "Order workspace",
    title: "Point of sale",
  },
  {
    description: "Track kitchen order tickets from order send through preparation and ready state.",
    id: "kot",
    label: "KOT",
    status: "Kitchen live board",
    title: "Kitchen order tickets",
  },
  {
    description: "Manage table reservations, guest counts, booking state, and seated visits.",
    id: "booking",
    label: "Booking",
    status: "Table service",
    title: "Table booking",
  },
  {
    description: "Post bills, collect split tenders, issue receipts, control cash shifts, and reconcile the day.",
    id: "billing",
    label: "Billing",
    status: "Payments and settlement",
    title: "Billing and settlement",
  },
  {
    description: "Track stock levels, recipes, daily plans, reservations, procurement, and consumption.",
    id: "inventory",
    label: "Inventory",
    status: "Stock ledger",
    title: "Inventory and stock",
  },
  {
    description: "Render documents, route print jobs across printers, and deliver receipts by email or WhatsApp.",
    id: "documents",
    label: "Documents",
    status: "Print and delivery",
    title: "Documents and printing",
  },
  {
    description: "Select the desktop data folder, schedule backups, and verify restores before relying on them.",
    id: "backup",
    label: "Backup",
    status: "Data protection",
    title: "Backup and recovery",
  },
  {
    description: "Register devices, review the change log, and resolve sync conflicts with a named decider.",
    id: "sync",
    label: "Sync",
    status: "Devices and conflicts",
    title: "Synchronization",
  },
  {
    description: "Connect marketplace partners, map menus, take in orders, fulfill deliveries, and post settlements.",
    id: "marketplace",
    label: "Marketplace",
    status: "Partner orders",
    title: "Marketplace channels",
  },
  {
    description: "Keep the chart of accounts, post balanced journals, and export posted records for the accountant.",
    id: "accounting",
    label: "Accounting",
    status: "Journals",
    title: "Accounting journals",
  },
  {
    description: "Read posted sales, tax, stock, and event records with location and business-day scope, plus alerts.",
    id: "reports",
    label: "Reports",
    status: "Posted records",
    title: "Reports and alerts",
  },
];

export async function registerQcafeWorkspaceRoute(app: FastifyInstance, providers: string[]): Promise<void> {
  app.get(
    "/api/v1/qcafe/workspace",
    {
      schema: {
        response: { 200: qcafeWorkspaceResponseSchema },
        tags: ["Workspace"],
      },
    },
    async () => ({
      pages: qcafeWorkspacePages,
      providers,
      status: "ok" as const,
    }),
  );
}
