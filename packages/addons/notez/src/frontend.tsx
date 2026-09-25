import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function NotezWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
