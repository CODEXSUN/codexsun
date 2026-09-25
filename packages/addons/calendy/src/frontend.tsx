import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function CalendyWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
