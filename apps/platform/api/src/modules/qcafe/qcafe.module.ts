import { defineModule } from "@codexsun/framework/modules";
import type { PlatformModuleDependencies } from "../../module-dependencies.js";
import { registerQCafeRoutes } from "./qcafe.routes.js";

export const qCafeModule = defineModule<PlatformModuleDependencies>({
  key: "qcafe",
  label: "Q Cafe",
  register({ app }) {
    return registerQCafeRoutes(app);
  }
});
