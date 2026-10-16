import type { IdeaBriefDraft } from "./idea-handover-workspace";

export type BriefReadinessItem = {
  complete: boolean;
  id: string;
  label: string;
};

export function getBriefReadiness(brief: IdeaBriefDraft): BriefReadinessItem[] {
  return [
    readinessItem("title", "A clear title", brief.title),
    readinessItem("outcome", "A defined outcome", brief.outcome),
    readinessItem("audience", "A named audience", brief.audience),
    readinessItem("scope", "Scope boundaries", brief.scope),
    readinessItem("exclusions", "Explicit exclusions", brief.exclusions),
    readinessItem("constraints", "Known constraints", brief.constraints),
    readinessItem("risks", "Risks to consider", brief.risks),
    readinessItem("success-signals", "Measurable success signals", brief.successSignals),
    { complete: brief.sourceMessageIds.length > 0, id: "sources", label: "At least one source response" },
    { complete: brief.projectScope === "all-projects" || Boolean(brief.projectReference?.trim()), id: "project", label: "A project reference when scoped" },
  ];
}

export function isBriefReady(brief: IdeaBriefDraft): boolean {
  return getBriefReadiness(brief).every((item) => item.complete);
}

export function parseAcceptanceCriteria(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export function serializeAcceptanceCriteria(items: readonly string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join("\n");
}

function readinessItem(id: string, label: string, value: string): BriefReadinessItem {
  return { complete: Boolean(value.trim()), id, label };
}
