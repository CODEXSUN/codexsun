import { z } from "zod";
const short = z.string().trim().min(1).max(180);
const text = z.string().trim().min(1).max(4000);
export const textileImageSchema = z
  .string()
  .max(600)
  .refine(
    (value) =>
      /^\/(?:textiles|standards)\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpg|jpeg)$/.test(value) ||
      /^https:\/\/[^\s"'<>\\()]+\.(?:webp|png|jpg|jpeg)(?:\?[^\s]*)?$/.test(value),
    "Use an approved local image path or HTTPS image URL."
  );
const heading = z.strictObject({ label: short, title: short, emphasis: short, intro: text });
export const textileContentSchema = z.strictObject({
  heroImage: textileImageSchema,
  heroAlt: short,
  categoryImage: textileImageSchema,
  industryImage: textileImageSchema,
  categories: heading.extend({
    items: z
      .array(
        z.strictObject({ title: short, description: text, image: textileImageSchema.optional() })
      )
      .length(12)
  }),
  directory: heading,
  associations: heading,
  community: heading,
  journey: heading.extend({
    items: z.array(z.strictObject({ title: short, description: text })).length(3)
  }),
  banner: heading.extend({ image: textileImageSchema, button: short }),
  notice: z.strictObject({ title: short, body: text }),
  documents: z
    .array(
      z.strictObject({
        path: z.enum(["contact", "join", "login", "privacy", "terms", "standards", "enterprises"]),
        title: short,
        intro: text,
        paragraphs: z.array(text).max(12)
      })
    )
    .max(7)
    .superRefine((docs, ctx) => {
      if (new Set(docs.map((doc) => doc.path)).size !== docs.length)
        ctx.addIssue({ code: "custom", message: "Each public page can appear only once." });
    })
});
export type TextileContent = z.infer<typeof textileContentSchema>;
