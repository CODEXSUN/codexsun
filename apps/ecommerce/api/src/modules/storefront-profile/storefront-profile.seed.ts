import { StorefrontProfileRepository } from "./storefront-profile.repository.js";
import { emptyStorefrontProfile } from "./storefront-profile.service.js";

export async function seedStorefrontProfileModule() {
  const repository = new StorefrontProfileRepository();
  if (!(await repository.get())) await repository.save(emptyStorefrontProfile(), "system:seed");
}
