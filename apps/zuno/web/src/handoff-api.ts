export interface AcceptedZetroHandoff {
  readonly acceptedAt: string;
  readonly handoff: {
    readonly brief: {
      readonly constraints: string;
      readonly exclusions: string;
      readonly outcome: string;
      readonly projectReference: string | null;
      readonly projectScope: "project" | "all-projects";
      readonly risks: string;
      readonly scope: string;
      readonly successSignals: string;
    };
    readonly task: {
      readonly acceptanceCriteria: string;
      readonly id: string;
      readonly priority: "low" | "medium" | "high";
      readonly summary: string;
      readonly title: string;
    };
  };
  readonly zunoHandoffId: string;
}

export async function listZetroHandoffs(baseUrl: string, request: typeof fetch = fetch): Promise<AcceptedZetroHandoff[]> {
  const response = await request(endpoint(baseUrl, "/api/v1/zuno/handoffs/zetro"));
  const payload = await readJson(response) as { data?: { handoffs?: unknown } };
  if (!Array.isArray(payload.data?.handoffs)) throw new Error("Zuno returned an invalid handoff inbox.");
  return payload.data.handoffs as AcceptedZetroHandoff[];
}

export function assignmentPrompt(handoff: AcceptedZetroHandoff): string {
  const { brief, task } = handoff.handoff;
  return [
    task.summary,
    "",
    "Acceptance criteria:",
    task.acceptanceCriteria,
    "",
    "Final brief context:",
    `Outcome: ${brief.outcome}`,
    `Scope: ${brief.scope}`,
    `Exclusions: ${brief.exclusions}`,
    `Constraints: ${brief.constraints}`,
    `Risks: ${brief.risks}`,
    `Success signals: ${brief.successSignals}`,
    "",
    `Zetro handoff receipt: ${handoff.zunoHandoffId}`,
  ].join("\n");
}

function endpoint(baseUrl: string, path: string): string {
  return baseUrl ? new URL(path, `${baseUrl.replace(/\/$/u, "")}/`).toString() : path;
}

async function readJson(response: Response): Promise<unknown> {
  const payload = await response.json() as unknown;
  if (response.ok) return payload;
  const error = payload as { error?: unknown };
  throw new Error(typeof error.error === "string" ? error.error : `Zuno request failed: ${response.status}`);
}
