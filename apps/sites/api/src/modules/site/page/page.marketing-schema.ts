import { z } from "zod";

const short = z.string().trim().min(1).max(180);
const text = z.string().trim().min(1).max(4000);
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const logicxMarketingImages = [
  { path: "/design/logicx-architecture.webp", label: "Architectural courtyard" },
  { path: "/service-previews/custom-software.svg", label: "Custom software illustration" },
  { path: "/service-previews/frappe-erp.svg", label: "ERP modules illustration" },
  { path: "/service-previews/react-web.svg", label: "React application illustration" },
  { path: "/service-previews/mobile-apps.svg", label: "Mobile application illustration" },
  { path: "/service-previews/automation.svg", label: "Workflow automation illustration" },
  { path: "/service-previews/integrations.svg", label: "Connected systems illustration" },
  { path: "/service-previews/ecommerce.svg", label: "Ecommerce illustration" },
  { path: "/service-previews/support.svg", label: "Software support illustration" }
] as const;
const image = z
  .string()
  .refine(
    (path) => logicxMarketingImages.some((item) => item.path === path),
    "Choose an available LogicX image."
  );
const heading = z.strictObject({ label: short, title: short, intro: text, button: short });

export const logicxMarketingSchema = z.strictObject({
  heroImage: image,
  approachImage: image,
  primaryLabel: short,
  secondaryLabel: short,
  navigationLabel: short,
  proofLabels: z.array(short).min(1).max(4),
  technologies: z.array(short).min(1).max(10),
  featuredServices: z.array(slug).max(6),
  serviceImages: z.array(z.strictObject({ slug, image })).max(30),
  services: heading,
  applications: heading,
  examples: heading,
  industries: heading,
  engagements: heading,
  faq: heading,
  closing: heading,
  exampleItems: z
    .array(z.strictObject({ title: short, detail: text, steps: z.array(short).min(1).max(6) }))
    .max(8),
  industryItems: z.array(z.strictObject({ title: short, detail: text })).max(12),
  engagementItems: z
    .array(
      z.strictObject({
        title: short,
        label: short,
        detail: text,
        items: z.array(short).min(1).max(8),
        topic: short
      })
    )
    .max(6),
  questions: z.array(z.strictObject({ title: short, answer: text })).max(20)
});

export type LogicxMarketing = z.infer<typeof logicxMarketingSchema>;
