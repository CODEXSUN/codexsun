import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function ChattyWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
