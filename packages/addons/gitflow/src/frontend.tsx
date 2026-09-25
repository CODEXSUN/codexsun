import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function GitflowWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
