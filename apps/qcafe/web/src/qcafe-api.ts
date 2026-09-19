export type QcafePageId = "overview" | "pos" | "kot" | "booking";

export type QcafeWorkspacePage = {
  description: string;
  id: QcafePageId;
  label: string;
  status: string;
  title: string;
};

export type QcafeWorkspace = {
  pages: QcafeWorkspacePage[];
  providers: string[];
  status: "ok";
};

export async function readWorkspace(): Promise<QcafeWorkspace> {
  const response = await fetch("/api/v1/qcafe/workspace", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Workspace request failed: ${response.status}`);
  return response.json() as Promise<QcafeWorkspace>;
}
