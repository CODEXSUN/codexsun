import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function FlowixWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
