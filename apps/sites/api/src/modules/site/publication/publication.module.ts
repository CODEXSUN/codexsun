import { registerPublicationRoutes } from "./publication.routes.js";
export const publicationModule = {
  key: "sites.publication",
  capabilities: { events: false, worker: false, sync: false, seed: false },
  register: registerPublicationRoutes
};
