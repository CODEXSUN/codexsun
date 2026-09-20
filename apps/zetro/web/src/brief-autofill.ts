import type { IdeaBriefDraft, IdeaHandoverSource } from "@codexsun/ui/blocks/idea-handover";

const fieldHeadings: Readonly<Record<keyof Pick<IdeaBriefDraft, "audience" | "constraints" | "exclusions" | "outcome" | "risks" | "scope" | "successSignals">, readonly string[]>> = {
  audience: ["audience", "users", "target users", "who it is for"],
  constraints: ["constraints", "limitations", "requirements"],
  exclusions: ["exclusions", "out of scope", "non-goals", "non goals"],
  outcome: ["outcome", "goal", "objective", "desired outcome"],
  risks: ["risks", "open risks", "concerns"],
  scope: ["scope", "in scope"],
  successSignals: ["success signals", "success criteria", "definition of done", "acceptance criteria"],
};

export function fillBriefFromSources(brief: IdeaBriefDraft, sources: readonly IdeaHandoverSource[]): IdeaBriefDraft {
  const selectedSources = sources.filter((source) => brief.sourceMessageIds.includes(source.id));
  if (!selectedSources.length) return brief;

  const sections = selectedSources.map((source) => parseSections(source.content));
  const title = brief.title.trim() || findTitle(selectedSources.map((source) => source.content));
  const outcome = brief.outcome.trim() || collectSections(sections, fieldHeadings.outcome) || findOpeningSummary(selectedSources[0]?.content ?? "");

  return {
    ...brief,
    audience: brief.audience.trim() || collectSections(sections, fieldHeadings.audience),
    constraints: brief.constraints.trim() || collectSections(sections, fieldHeadings.constraints),
    exclusions: brief.exclusions.trim() || collectSections(sections, fieldHeadings.exclusions),
    outcome,
    risks: brief.risks.trim() || collectSections(sections, fieldHeadings.risks),
    scope: brief.scope.trim() || collectSections(sections, fieldHeadings.scope),
    successSignals: brief.successSignals.trim() || collectSections(sections, fieldHeadings.successSignals),
    title,
  };
}

function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  let heading = "";
  let lines: string[] = [];

  const commit = () => {
    const value = lines.join("\n").trim();
    if (heading && value) sections.set(normalizeHeading(heading), value);
  };

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:#{1,6}\s+|\*\*)?([^:*#]+?)(?:\*\*)?\s*:\s*(.*)$/) ?? line.match(/^\s*#{1,6}\s+(.+?)\s*$/);
    if (!match) {
      lines.push(line);
      continue;
    }

    commit();
    heading = match[1]?.trim() ?? "";
    const inlineValue = match[2]?.replace(/^(?:\*\*|__)\s*/, "").trim();
    lines = inlineValue ? [inlineValue] : [];
  }

  commit();
  return sections;
}

function collectSections(sections: readonly Map<string, string>[], aliases: readonly string[]): string {
  const values = sections.flatMap((section) => aliases.map((alias) => section.get(alias)).filter((value): value is string => Boolean(value)));
  return [...new Set(values)].join("\n\n");
}

function findTitle(contents: readonly string[]): string {
  for (const content of contents) {
    const heading = content.split(/\r?\n/).map((line) => line.trim()).find((line) => /^#\s+/.test(line));
    if (heading) return trimText(heading.replace(/^#\s+/, ""), 100);
  }
  return trimText(findOpeningSummary(contents[0] ?? ""), 100);
}

function findOpeningSummary(content: string): string {
  const paragraphs = content
    .replace(/^\s*#{1,6}\s+.*$/gm, "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/^\s*[-*]\s+/gm, "").trim())
    .filter(Boolean);
  return trimText(paragraphs[0] ?? "", 500);
}

function normalizeHeading(value: string): string {
  return value.replace(/[*_`]/g, "").trim().toLowerCase();
}

function trimText(value: string, length: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}...`;
}
