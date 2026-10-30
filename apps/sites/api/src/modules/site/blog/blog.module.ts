import { registerBlogRoutes } from "./blog.routes.js";
export const blogModule = {
  key: "sites.blog",
  // No sample blog seeds, external jobs, or offline sync. Publication is a local database transaction.
  capabilities: { events: false, worker: false, sync: false, seed: false },
  register: registerBlogRoutes
};
