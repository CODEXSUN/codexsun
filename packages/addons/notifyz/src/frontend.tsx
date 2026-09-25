import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function NotifyzWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
