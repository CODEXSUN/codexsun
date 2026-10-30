import { registerRequirementsRoutes } from "./requirements.routes.js";
export const requirementsModule = {
  key: "codexsun.requirements",
  register: registerRequirementsRoutes,
  exemptions: {
    delete: "Requirements and approval history are retained for audit.",
    activation: "Draft, submission and approval states replace active/inactive.",
    async: "No execution workers or offline replication in phase one."
  }
};
