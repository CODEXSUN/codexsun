import { z } from "zod";
import { textileContentSchema } from "./page.textile-schema.js";
export {
  textileContentSchema,
  textileImageSchema,
  type TextileContent
} from "./page.textile-schema.js";
import { logicxMarketingSchema } from "./page.marketing-schema.js";
export {
  logicxMarketingSchema,
  logicxMarketingImages,
  type LogicxMarketing
} from "./page.marketing-schema.js";

const text = z.string().trim().min(1).max(4000);
const short = z.string().trim().min(1).max(180);
const title = z.strictObject({ label: short, title: short, emphasis: short, intro: text });
export const pageContentSchema = z.strictObject({
  marketing: logicxMarketingSchema.optional(),
  textile: textileContentSchema.optional(),
  applications: z
    .array(
      z.strictObject({
        slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
        name: short,
        category: short,
        summary: text,
        features: z.array(short).min(1).max(12)
      })
    )
    .max(50)
    .superRefine((apps, ctx) => {
      if (new Set(apps.map((app) => app.slug)).size !== apps.length)
        ctx.addIssue({ code: "custom", message: "Application slugs must be unique." });
    })
    .optional(),
  pageTitle: short,
  description: z.string().trim().min(1).max(320),
  profile: z.strictObject({
    name: short,
    brand: short,
    location: z.string().trim().max(180),
    tagline: short,
    domain: z
      .string()
      .trim()
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/),
    emails: z.array(z.email()).max(5),
    phones: z
      .array(z.strictObject({ label: short, href: z.string().regex(/^\+[0-9]{7,15}$/) }))
      .max(5),
    address: z.array(short).max(8),
    gstin: z.string().trim().max(30),
    whatsappNumber: z
      .string()
      .regex(/^$|^[1-9][0-9]{6,14}$/)
      .optional(),
    mapQuery: z.string().trim().max(300).optional()
  }),
  hero: z.strictObject({
    eyebrow: short,
    title: short,
    secondLine: short,
    emphasis: short,
    intro: text,
    button: short,
    caption: short,
    artLabel: short,
    artTitle: short,
    artEmphasis: short
  }),
  materials: z.strictObject({ names: z.array(short).min(1).max(12), caption: short }),
  about: title.extend({ lead: text, paragraphs: z.array(text).min(1).max(8), profileLink: short }),
  processing: title.extend({
    foundationLabel: short,
    foundation: z.array(short).min(1).max(12),
    lines: z
      .array(
        z.strictObject({
          title: short,
          description: text,
          stages: z
            .array(z.tuple([short, short]))
            .min(1)
            .max(12)
        })
      )
      .min(1)
      .max(6)
  }),
  finishes: title.extend({
    items: z.array(z.strictObject({ name: short, detail: text })).max(30)
  }),
  responsibility: title.extend({
    linkLabel: short,
    note: text,
    items: z.array(z.strictObject({ title: short, body: text })).max(12)
  }),
  equipment: z.strictObject({ label: short, names: z.array(short).max(30), note: text }),
  contact: title.extend({ officeLabel: short, mapLabel: short, formTitle: short, formIntro: text }),
  footer: z.strictObject({ lineOne: short, lineTwo: short })
});
export type PageContent = z.infer<typeof pageContentSchema>;
export const pageStateSchema = z.strictObject({
  content: pageContentSchema,
  revision: z.number().int().nonnegative(),
  publishedRevision: z.number().int().nonnegative()
});
export type PageState = z.infer<typeof pageStateSchema>;
export const pageSaveSchema = z.strictObject({
  content: pageContentSchema,
  revision: z.number().int().nonnegative()
});
