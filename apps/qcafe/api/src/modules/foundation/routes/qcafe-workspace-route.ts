import type { FastifyInstance } from "fastify";
import { z } from "zod";

const qcafePageIdSchema = z.enum(["overview", "pos", "kot", "booking"]);

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
    description: "Build the touch-first order screen for dine-in, takeaway, delivery, and counter sales.",
    id: "pos",
    label: "POS",
    status: "Scaffold",
    title: "Point of sale",
  },
  {
    description: "Track kitchen order tickets from order send through preparation and ready state.",
    id: "kot",
    label: "KOT",
    status: "Scaffold",
    title: "Kitchen order tickets",
  },
  {
    description: "Manage table reservations, guest counts, booking state, and seated visits.",
    id: "booking",
    label: "Booking",
    status: "Scaffold",
    title: "Table booking",
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
