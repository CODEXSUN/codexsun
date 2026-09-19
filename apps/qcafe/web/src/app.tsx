import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MainWorkspace } from "@codexsun/ui";
import { createQcafeNavigation, getQcafePages, QcafeWorkspaceView } from "./qcafe-workspace";
import { readWorkspace, type QcafePageId } from "./qcafe-api";

export function App() {
  const [activePageId, setActivePageId] = useState<QcafePageId>("overview");
  const workspace = useQuery({ queryKey: ["qcafe", "workspace"], queryFn: readWorkspace });
  const pages = getQcafePages(workspace.data);
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const navigation = useMemo(() => createQcafeNavigation(activePageId, pages, setActivePageId), [activePageId, pages]);
  const connectionState = workspace.isPending ? "connecting" : workspace.isError ? "failed" : "connected";

  return (
    <MainWorkspace
      applicationId="qcafe"
      applicationName="Q Cafe"
      navigation={navigation}
      primaryAction={null}
      searchPlaceholder="Search Q Cafe"
      sidebarStateKey="codexsun.qcafe.sidebar"
      statusLabel={connectionState === "connected" ? "API ready" : "Connecting"}
      workspaceTitle={activePage?.label ?? "Overview"}
    >
      <QcafeWorkspaceView activePageId={activePageId} connectionState={connectionState} workspace={workspace.data} />
    </MainWorkspace>
  );
}
