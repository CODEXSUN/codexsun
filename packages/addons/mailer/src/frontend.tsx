import { AddonWorkspace } from "@codexsun/addon-runtime/frontend";
import { definition } from "./index.js";

export function MailerWorkspace() {
  return <AddonWorkspace definition={definition} />;
}
