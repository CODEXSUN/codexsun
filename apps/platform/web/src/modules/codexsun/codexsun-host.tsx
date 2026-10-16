import { useMemo } from "react";
import { CodexsunPortal } from "@codexsun/codexsun-web";
import { createSessionBoundGateway } from "../../shared/api/platform-api";
import { getSessionSlot } from "../../shared/auth/tab-session";

export function CodexsunHost({ surface }: { surface: "frontdesk" | "workspace" | "approvals" }) {
  const slot = getSessionSlot();
  const gateway = useMemo(() => createSessionBoundGateway("tenant"), [slot]);
  return <CodexsunPortal key={slot ?? "signed-out"} gateway={gateway} surface={surface} />;
}
