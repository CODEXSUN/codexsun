import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";

export function SopStatusBadge({ status }: { status: string }) {
  const tone =
    status === "active" || status === "published"
      ? "success"
      : status === "draft"
        ? "warning"
        : "neutral";
  return (
    <WorkspaceStatusBadge tone={tone} label={status.charAt(0).toUpperCase() + status.slice(1)} />
  );
}
