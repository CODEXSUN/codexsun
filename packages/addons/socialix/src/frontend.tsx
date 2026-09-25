import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function SocialixWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
