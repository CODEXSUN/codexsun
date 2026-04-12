import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell";

type ZetroReviewLaneId =
  | "architecture"
  | "security"
  | "performance"
  | "code-quality"
  | "testing"
  | "documentation"
  | "compliance"
  | "general";
type ZetroReviewSeverity = "critical" | "high" | "medium" | "low";

type ZetroReviewLane = {
  id: ZetroReviewLaneId;
  name: string;
  description: string;
  keywords: string[];
  defaultSeverity: ZetroReviewSeverity;
};

type ZetroReviewFinding = {
  title: string;
  summary: string;
  laneId: ZetroReviewLaneId;
  severity: ZetroReviewSeverity;
  confidence: number;
  category?: string;
  file?: string;
  line?: number;
};

type ZetroReviewSummary = {
  total: number;
  open: number;
  accepted: number;
  dismissed: number;
  fixed: number;
  deferred: number;
  byLane: Record<ZetroReviewLaneId, number>;
  bySeverity: Record<ZetroReviewSeverity, number>;
};

const REVIEW_LANES: ZetroReviewLane[] = [
  {
    id: "architecture",
    name: "Architecture",
    description: "Design, structure, and system-level concerns.",
    keywords: ["architecture", "design", "structure", "component"],
    defaultSeverity: "high",
  },
  {
    id: "security",
    name: "Security",
    description: "Vulnerabilities, injection risks, and access control.",
    keywords: ["security", "injection", "xss", "sql", "auth", "permission"],
    defaultSeverity: "critical",
  },
  {
    id: "performance",
    name: "Performance",
    description: "Slow queries, N+1 patterns, and resource waste.",
    keywords: ["performance", "slow", "n+1", "memory", "latency"],
    defaultSeverity: "high",
  },
  {
    id: "code-quality",
    name: "Code Quality",
    description: "Readability, duplication, and maintainability.",
    keywords: ["refactor", "duplicate", "readability", "complex"],
    defaultSeverity: "medium",
  },
  {
    id: "testing",
    name: "Testing",
    description: "Missing tests, coverage gaps, and test quality.",
    keywords: ["test", "coverage", "assertion", "mock"],
    defaultSeverity: "medium",
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Missing docs, unclear comments, and API gaps.",
    keywords: ["documentation", "comment", "readme", "docstring"],
    defaultSeverity: "low",
  },
  {
    id: "compliance",
    name: "Compliance",
    description: "License, privacy, and regulatory concerns.",
    keywords: ["license", "gdpr", "privacy", "compliance", "copyright"],
    defaultSeverity: "high",
  },
  {
    id: "general",
    name: "General",
    description: "Uncategorized observations and general suggestions.",
    keywords: [],
    defaultSeverity: "medium",
  },
];

function detectReviewLane(title: string, summary: string): ZetroReviewLaneId {
  const combined = (title + " " + summary).toLowerCase();
  for (const lane of REVIEW_LANES) {
    for (const keyword of lane.keywords) {
      if (combined.includes(keyword)) return lane.id;
    }
  }
  return "general";
}

function mapSeverity(laneId: ZetroReviewLaneId): ZetroReviewSeverity {
  const lane = REVIEW_LANES.find((l) => l.id === laneId);
  return (lane?.defaultSeverity ?? "medium") as ZetroReviewSeverity;
}

function mapConfidence(
  parsed: number | undefined,
  hasFile: boolean,
  hasLine: boolean,
): number {
  if (!parsed) return hasFile ? (hasLine ? 90 : 70) : 50;
  if (parsed < 0 || parsed > 100) return hasFile ? (hasLine ? 90 : 70) : 50;
  return parsed;
}

function buildReviewSummary(
  findings: ZetroReviewFinding[],
): ZetroReviewSummary {
  const summary: ZetroReviewSummary = {
    total: findings.length,
    open: findings.length,
    accepted: 0,
    dismissed: 0,
    fixed: 0,
    deferred: 0,
    byLane: {
      architecture: 0,
      security: 0,
      performance: 0,
      "code-quality": 0,
      testing: 0,
      documentation: 0,
      compliance: 0,
      general: 0,
    },
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
  };
  for (const f of findings) {
    summary.byLane[f.laneId]++;
    summary.bySeverity[f.severity]++;
  }
  return summary;
}

function parseFindingsFromContent(content: string): ZetroReviewFinding[] {
  const findingBlocks: ZetroReviewFinding[] = [];
  const blockRegex = /\[FINDING\]([\s\S]*?)\[\/FINDING\]/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(content)) !== null) {
    const block = match[1];
    const titleMatch = /title:\s*(.+)/i.exec(block);
    const summaryMatch = /summary:\s*(.+)/i.exec(block);
    const categoryMatch = /category:\s*(.+)/i.exec(block);
    const fileMatch = /file:\s*(.+)/i.exec(block);
    const lineMatch = /line:\s*(\d+)/i.exec(block);
    const severityMatch = /severity:\s*(critical|high|medium|low)/i.exec(block);
    const confidenceMatch = /confidence:\s*(\d+)/i.exec(block);

    const title = titleMatch?.[1]?.trim() ?? "Untitled finding";
    const summary =
      summaryMatch?.[1]?.trim() ?? summaryMatch?.[1]?.trim() ?? "";
    const category = categoryMatch?.[1]?.trim();
    const file = fileMatch?.[1]?.trim();
    const line = lineMatch ? Number(lineMatch[1]) : undefined;
    const laneId = detectReviewLane(title, summary);
    const severity =
      (severityMatch?.[1] as ZetroReviewSeverity) ?? mapSeverity(laneId);
    const confidence = mapConfidence(
      confidenceMatch ? Number(confidenceMatch[1]) : undefined,
      Boolean(file),
      Boolean(line),
    );

    findingBlocks.push({
      title,
      summary,
      laneId,
      severity,
      confidence,
      category,
      file,
      line,
    });
  }
  return findingBlocks;
}

const SEVERITY_VARIANT: Record<
  ZetroReviewSeverity,
  "destructive" | "secondary" | "outline"
> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function ZetroReviewPage() {
  const [content, setContent] = useState("");
  const [parsedFindings, setParsedFindings] = useState<ZetroReviewFinding[]>(
    [],
  );
  const [summary, setSummary] = useState<ZetroReviewSummary | null>(null);
  const [selectedLane, setSelectedLane] = useState<ZetroReviewLaneId | "all">(
    "all",
  );

  function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseFindingsFromContent(content);
    setParsedFindings(parsed);
    setSummary(buildReviewSummary(parsed));
  }

  function handleClear() {
    setContent("");
    setParsedFindings([]);
    setSummary(null);
  }

  const laneFindings =
    selectedLane === "all"
      ? parsedFindings
      : parsedFindings.filter((f) => f.laneId === selectedLane);

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Review"
        title="Review lanes"
        description="Review lanes organize AI-generated findings into structured categories with severity and confidence mapping."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {REVIEW_LANES.map((lane) => (
          <ZetroPanel key={lane.id}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between">
                <p className="text-foreground font-semibold">{lane.name}</p>
                <Badge
                  variant={
                    lane.defaultSeverity === "critical"
                      ? "destructive"
                      : lane.defaultSeverity === "high"
                        ? "destructive"
                        : lane.defaultSeverity === "medium"
                          ? "secondary"
                          : "outline"
                  }
                  className="rounded-md text-xs"
                >
                  {lane.defaultSeverity}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-6">
                {lane.description}
              </p>
              {summary ? (
                <p className="text-foreground text-2xl font-semibold">
                  {summary.byLane[lane.id as ZetroReviewLaneId]}
                </p>
              ) : null}
            </CardContent>
          </ZetroPanel>
        ))}
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Total findings
              </p>
              <p className="text-foreground text-3xl font-semibold">
                {summary.total}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Critical
              </p>
              <p className="text-destructive text-3xl font-semibold">
                {summary.bySeverity.critical}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">High</p>
              <p className="text-destructive text-3xl font-semibold">
                {summary.bySeverity.high}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Medium
              </p>
              <p className="text-foreground text-3xl font-semibold">
                {summary.bySeverity.medium}
              </p>
            </CardContent>
          </ZetroPanel>
        </div>
      ) : null}

      <ZetroPanel>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-foreground font-semibold">
              Parse review findings
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Paste model output containing [FINDING]...[/FINDING] blocks to
              extract structured findings.
            </p>
          </div>
          <form className="space-y-3" onSubmit={handleParse}>
            <div className="grid gap-2">
              <Label htmlFor="review-content">Model output</Label>
              <Textarea
                id="review-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  "Paste model output here containing:\n[FINDING]\ntitle: ...\nsummary: ...\nseverity: high\n[/FINDING]"
                }
                rows={10}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="rounded-md"
                disabled={!content.trim()}
              >
                Parse findings
              </Button>
              {parsedFindings.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </ZetroPanel>

      {parsedFindings.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedLane === "all" ? "secondary" : "outline"}
              size="sm"
              className="rounded-md"
              onClick={() => setSelectedLane("all")}
            >
              All ({parsedFindings.length})
            </Button>
            {REVIEW_LANES.map((lane) => (
              <Button
                key={lane.id}
                variant={selectedLane === lane.id ? "secondary" : "outline"}
                size="sm"
                className="rounded-md"
                onClick={() => setSelectedLane(lane.id)}
              >
                {lane.name} (
                {summary?.byLane[lane.id as ZetroReviewLaneId] ?? 0})
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {laneFindings.map((finding, index) => (
              <ZetroPanel key={index}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-foreground font-semibold">
                        {finding.title}
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {finding.summary}
                      </p>
                    </div>
                    <Badge
                      variant={SEVERITY_VARIANT[finding.severity]}
                      className="shrink-0 rounded-md"
                    >
                      {finding.severity}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-md">
                      {REVIEW_LANES.find((l) => l.id === finding.laneId)
                        ?.name ?? finding.laneId}
                    </Badge>
                    <Badge variant="secondary" className="rounded-md">
                      {finding.confidence}% confidence
                    </Badge>
                    {finding.category ? (
                      <Badge variant="outline" className="rounded-md">
                        {finding.category}
                      </Badge>
                    ) : null}
                    {finding.file ? (
                      <Badge
                        variant="outline"
                        className="rounded-md font-mono text-xs"
                      >
                        {finding.file}
                        {finding.line ? `:${finding.line}` : ""}
                      </Badge>
                    ) : null}
                  </div>
                </CardContent>
              </ZetroPanel>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
