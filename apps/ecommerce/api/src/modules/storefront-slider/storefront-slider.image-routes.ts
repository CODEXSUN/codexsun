import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { StorefrontSliderStorage } from "./storefront-slider.storage.js";

export async function registerStorefrontSliderImageRoutes(app: FastifyInstance) {
  const storage = new StorefrontSliderStorage();
  app.get("/storefront/slider-images/:fileName", async (request, reply) => {
    const { fileName } = z.object({ fileName: z.string().min(1).max(255) }).parse(request.params);
    const options = z
      .object({
        format: z.enum(["avif", "webp"]).default("webp"),
        width: z.coerce.number().int().min(320).max(1920).optional()
      })
      .parse(request.query);
    const content = await storage.content(fileName);
    const body = options.width
      ? await sharp(content)
          .resize({ width: options.width, withoutEnlargement: true })
          .toFormat(options.format, { quality: 82 })
          .toBuffer()
      : content;
    return reply
      .header("Cache-Control", "public, max-age=86400")
      .type(options.width ? `image/${options.format}` : "image/webp")
      .send(body);
  });
}
