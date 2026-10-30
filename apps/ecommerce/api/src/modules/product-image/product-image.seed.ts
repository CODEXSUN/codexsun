import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";
export async function seedProductImageModule() {
  await sql`UPDATE ecommerce_product_images SET status='inactive' WHERE status NOT IN ('active','inactive')`.execute(
    getEcommerceDatabase()
  );
  for (let index = 0; index < images.length; index += 1) {
    const item = images[index]!;
    await sql`INSERT INTO ecommerce_product_images
      (uuid,product_information_id,variant_id,url,alt_text,caption,sort_order,is_primary,status,created_by)
      SELECT LOWER(HEX(RANDOM_BYTES(4))),product.id,NULL,${item.url},${item.alt},${item.caption},
        1,1,'active','system:catalog-seed' FROM ecommerce_product_information product
      WHERE product.slug=${item.slug} AND NOT EXISTS (
        SELECT 1 FROM ecommerce_product_images image WHERE image.product_information_id=product.id AND image.is_primary=1
      ) LIMIT 1`.execute(getEcommerceDatabase());
  }
}

const image = (slug: string, id: string, alt: string) => ({
  alt,
  caption: "Product lifestyle image from Unsplash",
  slug,
  url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`
});
const images = [
  image("acer-aspire-5-15", "photo-1496181133206-80ce9b88a853", "Acer laptop on a clean desk"),
  image(
    "asus-vivobook-15-oled",
    "photo-1517336714731-489689fd1ca8",
    "Slim laptop with vivid display"
  ),
  image("lenovo-ideapad-slim-5", "photo-1541807084-5c52b6b3adef", "Portable laptop ready for work"),
  image(
    "dell-inspiron-compact-desktop",
    "photo-1593640408182-31c70c8268f5",
    "Modern desktop computer workspace"
  ),
  image(
    "samsung-viewfinity-27",
    "photo-1527443224154-c4a3942d3acf",
    "Large monitor on a minimalist desk"
  ),
  image("logitech-mx-master-mouse", "photo-1527864550417-7fd91fc51a46", "Wireless computer mouse"),
  image(
    "logitech-mx-keys-keyboard",
    "photo-1587829741301-dc798b83add3",
    "Wireless keyboard close-up"
  ),
  image(
    "hp-usb-c-universal-hub",
    "photo-1625842268584-8f3296236761",
    "USB-C hub and computer accessories"
  )
] as const;
