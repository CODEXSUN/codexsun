import { registerStorefrontOrganisationRoutes } from "./storefront-organisation.routes.js";

export const storefrontOrganisationModule = {
  key: "ecommerce.storefront.organisation",
  // Singleton settings: no record list, create, delete, worker, or sync lifecycle.
  register: registerStorefrontOrganisationRoutes
};
