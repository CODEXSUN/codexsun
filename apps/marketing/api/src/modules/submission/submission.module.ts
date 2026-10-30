import { registerSubmissionRoutes } from "./submission.routes.js";
export const submissionModule = {
  key: "marketing.submission",
  capabilities: { events: true, worker: true, sync: true },
  register: registerSubmissionRoutes
};
