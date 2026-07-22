import { defineModule } from "@codexsun/framework/modules";
import type { PlatformModuleDependencies } from "../../module-dependencies.js";
import { registerProjectManagerRoutes } from "./project-manager.routes.js";

export const projectManagerModule = defineModule<PlatformModuleDependencies>({
  key: "platform.project-manager",
  label: "Project Manager",
  register({ app }) {
    return registerProjectManagerRoutes(app);
  }
});
