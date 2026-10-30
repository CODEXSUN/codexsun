import { StorefrontAnnouncementRepository } from "./storefront-announcement.repository.js";
import { StorefrontAnnouncementService } from "./storefront-announcement.service.js";

export async function seedStorefrontAnnouncementModule() {
  const repository = new StorefrontAnnouncementRepository();
  if ((await repository.list()).length) return;
  await new StorefrontAnnouncementService(repository).trigger({
    displayDurationMs: 12000,
    message: "Free delivery on selected systems · Business purchase support available"
  });
}
