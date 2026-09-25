import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function WikizWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
