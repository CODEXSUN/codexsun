import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function TaskezWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
