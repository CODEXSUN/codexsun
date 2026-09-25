import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function MeetyWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
