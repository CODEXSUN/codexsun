import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { DatabaseIcon, LightbulbIcon } from "lucide-react";
import { Toaster } from "sonner";
import { MainLayout } from "@codexsun/ui/layouts/main-layouts";
import { ProjectManagerWorkspaceHost } from "./codexsun";
import "@codexsun/ui/styles.css";

declare const __CODEXSUN_PLATFORM_WEB_PORT__: number;
type Workspace = "ideas" | "registry";

function platformUrl() {
  const url = new URL(window.location.href);
  url.port = String(__CODEXSUN_PLATFORM_WEB_PORT__);
  url.pathname = "/sa/project-manager-registry";
  url.search = "";
  url.hash = "";
  return url.href;
}

function ProjectManagerApp() {
  const [workspace, setWorkspace] = useState<Workspace>(
    window.location.pathname === "/ideas" ? "ideas" : "registry"
  );
  useEffect(() => {
    const onHistoryChange = () =>
      setWorkspace(window.location.pathname === "/ideas" ? "ideas" : "registry");
    window.addEventListener("popstate", onHistoryChange);
    return () => window.removeEventListener("popstate", onHistoryChange);
  }, []);
  const session = useQuery({
    queryKey: ["project-manager", "session"],
    retry: false,
    queryFn: async () => {
      const slot = sessionStorage.getItem("codexsun.auth.slot");
      const response = await fetch("/api/platform/auth/session", {
        credentials: "include",
        headers: slot ? { "x-codexsun-session-slot": slot } : {}
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error("Session unavailable");
      return body.data as {
        authenticated: boolean;
        email: string;
        name?: string;
        userType: string;
      };
    }
  });
  if (session.isPending) return <p role="status">Loading Project Manager…</p>;
  if (session.isError || !session.data.authenticated || session.data.userType !== "super_admin")
    return (
      <main>
        <h1>Project Manager</h1>
        <p>Sign in as Super Admin in Platform.</p>
        <a href={platformUrl()}>Open Platform</a>
      </main>
    );
  function navigate(value: Workspace) {
    history.pushState(null, "", value === "ideas" ? "/ideas" : "/registry");
    setWorkspace(value);
  }
  return (
    <MainLayout
      applicationName="Project Manager"
      workspaceTitle={workspace === "ideas" ? "Ideas" : "Platform Registry"}
      statusLabel="Connected to Platform"
      user={{
        email: session.data.email,
        name: session.data.name ?? session.data.email,
        fallback: "PM"
      }}
      navigation={[
        {
          label: "Project Manager",
          icon: DatabaseIcon,
          items: [
            { label: "Ideas", icon: LightbulbIcon, onSelect: () => navigate("ideas") },
            { label: "Platform Registry", icon: DatabaseIcon, onSelect: () => navigate("registry") }
          ]
        }
      ]}
      appItems={[
        {
          title: "Platform",
          description: "Super Admin desk",
          icon: DatabaseIcon,
          url: platformUrl()
        }
      ]}
      onLogout={async () => {
        const slot = sessionStorage.getItem("codexsun.auth.slot");
        await fetch("/api/platform/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: slot ? { "x-codexsun-session-slot": slot } : {}
        });
        sessionStorage.removeItem("codexsun.auth.slot");
        window.location.assign(platformUrl());
      }}
    >
      <ProjectManagerWorkspaceHost workspaceId={workspace} />
      <Toaster />
    </MainLayout>
  );
}

const handoff = new URLSearchParams(window.location.hash.slice(1)).get("sessionSlot");
if (handoff && /^[0-9a-f]{32}$/u.test(handoff)) sessionStorage.setItem("codexsun.auth.slot", handoff);
if (handoff) history.replaceState(null, "", window.location.pathname + window.location.search);
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <ProjectManagerApp />
  </QueryClientProvider>
);
