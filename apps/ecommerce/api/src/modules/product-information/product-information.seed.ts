import { sql } from "kysely";
import { getEcommerceDatabase } from "../../database/ecommerce-database.js";

export async function seedProductInformationModule() {
  await sql`UPDATE ecommerce_product_information SET publication_status='draft'
    WHERE publication_status NOT IN ('draft','published','archived')`.execute(
    getEcommerceDatabase()
  );
  for (const item of storefrontProducts) {
    await sql`INSERT INTO ecommerce_product_information
      (uuid,core_product_id,brand_id,storefront_title,subtitle,slug,short_description,description,
       bullet_points_json,material,country_of_origin,manufacturer,warranty,return_policy,shipping_class,
       weight,length,width,height,minimum_order_quantity,maximum_order_quantity,seo_title,seo_description,
       publication_status,is_featured,status,created_by)
      SELECT LOWER(HEX(RANDOM_BYTES(4))),product.id,brand.id,${item.title},${item.subtitle},${item.slug},
        ${item.shortDescription},${item.description},${JSON.stringify(item.bullets)},${item.material},'India',
        ${item.brand},'1 year manufacturer warranty','7-day replacement for eligible items','standard',
        ${item.weight},${item.length},${item.width},${item.height},1,5,${item.title},${item.shortDescription},
        'published',${item.featured ? 1 : 0},'active','system:catalog-seed'
      FROM core_products product INNER JOIN core_brands brand ON brand.name=${item.brand}
      WHERE product.name=${item.coreName} AND product.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM ecommerce_product_information WHERE core_product_id=product.id OR slug=${item.slug})
      LIMIT 1`.execute(getEcommerceDatabase());
  }
}

const storefrontProducts = [
  product(
    "Acer Aspire 5 15 Laptop",
    "Acer",
    "acer-aspire-5-15",
    "Acer Aspire 5 15",
    "Everyday performance, a crisp display, and dependable battery life.",
    54990,
    true,
    ["Intel Core i5 processor", "16 GB memory and 512 GB SSD", "15.6-inch Full HD display"]
  ),
  product(
    "ASUS Vivobook 15 OLED",
    "ASUS",
    "asus-vivobook-15-oled",
    "ASUS Vivobook 15 OLED",
    "Vivid OLED visuals in a lightweight laptop built for study and creative work.",
    66990,
    true,
    ["15.6-inch OLED display", "16 GB memory and 512 GB SSD", "Backlit keyboard"]
  ),
  product(
    "Lenovo IdeaPad Slim 5",
    "Lenovo",
    "lenovo-ideapad-slim-5",
    "Lenovo IdeaPad Slim 5",
    "A slim aluminium laptop for productive days and effortless travel.",
    71990,
    true,
    ["AMD Ryzen 7 processor", "16 GB memory and 1 TB SSD", "Rapid Charge support"]
  ),
  product(
    "Dell Inspiron Compact Desktop",
    "Dell",
    "dell-inspiron-compact-desktop",
    "Dell Inspiron Compact Desktop",
    "A space-saving desktop with the power for business, learning, and home use.",
    62990,
    false,
    ["Intel Core i5 processor", "16 GB memory and 1 TB SSD", "Wi-Fi 6 and Bluetooth"]
  ),
  product(
    "Samsung ViewFinity 27 Monitor",
    "Samsung",
    "samsung-viewfinity-27",
    "Samsung ViewFinity 27-inch Monitor",
    "A sharp, spacious display for focused work and rich entertainment.",
    24990,
    true,
    ["27-inch QHD IPS panel", "HDR10 colour", "Height-adjustable stand"]
  ),
  product(
    "Logitech MX Master Wireless Mouse",
    "Logitech",
    "logitech-mx-master-mouse",
    "Logitech MX Master Wireless Mouse",
    "Precision control and quiet comfort for demanding workflows.",
    8995,
    false,
    ["8K DPI tracking", "Quiet MagSpeed scrolling", "Connect up to three devices"]
  ),
  product(
    "Logitech MX Keys Wireless Keyboard",
    "Logitech",
    "logitech-mx-keys-keyboard",
    "Logitech MX Keys Wireless Keyboard",
    "Low-profile illuminated keys shaped for comfortable, accurate typing.",
    11995,
    false,
    ["Smart backlighting", "Multi-device workflow", "USB-C rechargeable"]
  ),
  product(
    "HP USB-C Universal Hub",
    "HP",
    "hp-usb-c-universal-hub",
    "HP USB-C Universal Hub",
    "One compact hub for displays, accessories, networking, and power pass-through.",
    6490,
    false,
    ["HDMI and DisplayPort", "USB-A and USB-C ports", "Gigabit Ethernet"]
  )
] as const;

function product(
  coreName: string,
  brand: string,
  slug: string,
  title: string,
  shortDescription: string,
  price: number,
  featured: boolean,
  bullets: string[]
) {
  return {
    brand,
    bullets,
    coreName,
    description: `${shortDescription} Carefully selected for the CXShop computer collection with transparent pricing and dependable support.`,
    featured,
    height: 3,
    length: 36,
    material: "Electronics",
    price,
    shortDescription,
    slug,
    subtitle: `From ₹${price.toLocaleString("en-IN")}`,
    title,
    weight: 1.5,
    width: 24
  };
}
