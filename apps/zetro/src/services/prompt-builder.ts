import type { ZetroOutputModeId } from "../../shared/index.js";
import type { ZetroModelMessage } from "./model-provider-types.js";
import { zetroStaticPlaybooks } from "../../shared/static-playbooks.js";

export type ZetroPromptContext = {
  workspacePath?: string;
  currentFile?: string;
  selectedText?: string;
  recentFiles?: string[];
  recentCommands?: string[];
  activeRunId?: string;
  playbookId?: string;
};

export type ZetroRepoContext = {
  rootDir?: string;
  packageName?: string;
  language?: string;
  framework?: string;
  testFramework?: string;
  dbFramework?: string;
  repoStructure?: string;
};

export type ZetroParsedFinding = {
  title: string;
  summary: string;
  category: string;
  severity: string;
  confidence: number;
  file?: string;
  line?: number;
};

export type ZetroParsedCommandProposal = {
  command: string;
  args: string[];
  summary: string;
  rationale?: string;
};

const OUTPUT_MODE_SYSTEM_PROMPTS: Record<ZetroOutputModeId, string> = {
  brief: `You are a concise coding assistant. Give brief answers. Focus on the answer and next action.`,
  normal: `You are a helpful coding assistant. Provide balanced responses with context. Include relevant code examples.`,
  detailed: `You are a thorough coding assistant. Provide detailed analysis including:
- Context and background
- Implementation plan
- Files affected
- Tests to consider
- Risks and mitigations`,
  maximum: `You are a comprehensive coding assistant. Provide maximum-detail responses including:
- Intent and goals
- Repository context
- Architecture decisions
- Implementation plan with steps
- Database impact assessment
- API impact assessment
- UI impact assessment
- Risk register
- Test plan
- Done criteria

Format responses with clear sections. Use markdown headers for each section.`,
  audit: `You are a code review assistant. Provide structured audit responses including:
- Intent verified
- Assumptions documented
- Approvals needed
- Command log
- Findings
- Decisions made
- Follow-up items

Be thorough. Every claim must be verifiable. Format findings in a structured way for easy parsing.`,
};

const SAFETY_GUARDRAIL_PROMPT = `

IMPORTANT SAFETY RULES:
- NEVER write files directly. Describe what files should contain and let the operator execute.
- NEVER execute shell commands. Propose commands for operator approval.
- NEVER expose secrets, API keys, or credentials in responses.
- If asked to do something unsafe, explain why and suggest a safer alternative.
- Always summarize what you analyzed and what you recommend.`;

export function buildSystemPrompt(
  outputMode: ZetroOutputModeId,
  context?: ZetroPromptContext,
  repoContext?: ZetroRepoContext,
): string {
  const modePrompt =
    OUTPUT_MODE_SYSTEM_PROMPTS[outputMode] ?? OUTPUT_MODE_SYSTEM_PROMPTS.normal;
  const guardrail = SAFETY_GUARDRAIL_PROMPT;

  let contextPrompt = "";

  if (context || repoContext) {
    const parts: string[] = [];

    if (repoContext) {
      const repoParts: string[] = [];
      if (repoContext.packageName)
        repoParts.push(`Package: ${repoContext.packageName}`);
      if (repoContext.language)
        repoParts.push(`Language: ${repoContext.language}`);
      if (repoContext.framework)
        repoParts.push(`Framework: ${repoContext.framework}`);
      if (repoContext.testFramework)
        repoParts.push(`Test framework: ${repoContext.testFramework}`);
      if (repoContext.dbFramework)
        repoParts.push(`Database: ${repoContext.dbFramework}`);
      if (repoContext.repoStructure)
        repoParts.push(`Structure:\n${repoContext.repoStructure}`);
      if (repoParts.length > 0) {
        parts.push(`Repository:\n${repoParts.join("\n")}`);
      }
    }

    if (context) {
      if (context.workspacePath) {
        parts.push(`Workspace: ${context.workspacePath}`);
      }

      if (context.currentFile) {
        parts.push(`Current file: ${context.currentFile}`);
      }

      if (context.selectedText) {
        parts.push(`Selected text:\n\`\`\`\n${context.selectedText}\n\`\`\``);
      }

      if (context.recentFiles && context.recentFiles.length > 0) {
        parts.push(
          `Recent files:\n${context.recentFiles.map((f) => `- ${f}`).join("\n")}`,
        );
      }

      if (context.recentCommands && context.recentCommands.length > 0) {
        parts.push(
          `Recent commands:\n${context.recentCommands.map((c) => `- ${c}`).join("\n")}`,
        );
      }

      if (context.activeRunId) {
        parts.push(`Active run: ${context.activeRunId}`);
      }

      if (context.playbookId) {
        const playbook = zetroStaticPlaybooks.find(
          (p) => p.id === context.playbookId,
        );
        if (playbook) {
          parts.push(`Current playbook: ${playbook.name}\n${playbook.summary}`);
        }
      }
    }

    if (parts.length > 0) {
      contextPrompt = `\n\nContext:\n${parts.join("\n\n")}`;
    }
  }

  return `${modePrompt}${guardrail}${contextPrompt}`;
}

export function buildPromptFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  outputMode: ZetroOutputModeId,
  context?: ZetroPromptContext,
  repoContext?: ZetroRepoContext,
): ZetroModelMessage[] {
  const systemContent = buildSystemPrompt(outputMode, context, repoContext);

  const result: ZetroModelMessage[] = [
    { role: "system", content: systemContent },
  ];

  for (const msg of messages) {
    result.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  return result;
}

export function extractCommandProposals(content: string): string[] {
  const commandPattern =
    /(?:npm|yarn|pnpm|npx|node|python|pip|git|make|docker|kubectl)\s+[^\n]+/g;
  const matches = content.match(commandPattern);
  return matches ? [...new Set(matches)] : [];
}

export function parseCommandProposals(
  content: string,
): ZetroParsedCommandProposal[] {
  const proposals: ZetroParsedCommandProposal[] = [];

  const codeBlockPattern = /```(?:bash|sh|shell)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    const code = match[1] ?? "";
    const lines = code.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//")) {
        const parts = trimmed.split(/\s+/);
        if (
          parts[0] &&
          !trimmed.startsWith("/") &&
          !trimmed.startsWith("~") &&
          !trimmed.startsWith("$")
        ) {
          proposals.push({
            command: parts[0] ?? "",
            args: parts.slice(1),
            summary: `Command from code block: ${parts.join(" ")}`,
          });
        }
      }
    }
  }

  const inlinePattern =
    /(?:npm|yarn|pnpm|npx|node|python|pip|git|make|docker|kubectl)\s+[^\n]+/g;
  while ((match = inlinePattern.exec(content)) !== null) {
    const fullMatch = match[0] ?? "";
    const parts = fullMatch.split(/\s+/);
    proposals.push({
      command: parts[0] ?? "",
      args: parts.slice(1),
      summary: `Proposed command: ${fullMatch}`,
    });
  }

  return proposals;
}

export function parseFindings(content: string): ZetroParsedFinding[] {
  const findings: ZetroParsedFinding[] = [];

  const findingPatterns = [
    /(?:^|\n)(?:[-*])\s+(Finding|FIXME|TODO|BUG|HACK|DEPRECATED|WARNING|ISSUE|ERROR|RISK):\s*(.+)/gi,
    /(?:^|\n)(?:[-*])\s+(.+?)\s*\(severity:\s*(low|medium|high|critical)\)/gi,
    /(?:^|\n)(?:[-*])\s+(?:in|at)\s+([^\s]+\.\w+)(?::(\d+))?\s*[-:]\s*(.+)/gi,
  ];

  for (const pattern of findingPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const title = match[1] ?? "";
      const severity = match[2] ?? "";
      const file = match[3] ?? "";
      const line = match[4] ?? "";
      const summary = match[5] ?? "";

      if (title || summary) {
        findings.push({
          title: (title || summary).trim(),
          summary: (summary || title || "").trim(),
          category: "general",
          severity: severity?.toLowerCase() || "medium",
          confidence: 75,
          file: file?.trim(),
          line: line ? parseInt(line, 10) : undefined,
        });
      }
    }
  }

  return findings;
}

export function stripCommandExecution(content: string): string {
  return content
    .replace(/```bash\n[\s\S]*?```/g, "[command proposal]")
    .replace(/```sh\n[\s\S]*?```/g, "[command proposal]")
    .replace(/```shell\n[\s\S]*?```/g, "[command proposal]")
    .replace(
      /(?:npm|yarn|pnpm|npx|node|python|pip|git|make|docker|kubectl)\s+[^\n]+/g,
      "[command proposal]",
    );
}

export function logTokenUsage(
  usage:
    | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
    | undefined,
  model: string,
): string {
  if (!usage) {
    return "";
  }

  return [
    "",
    "--- Token Usage ---",
    `Model: ${model}`,
    `Prompt tokens: ${usage.promptTokens ?? "unknown"}`,
    `Completion tokens: ${usage.completionTokens ?? "unknown"}`,
    `Total tokens: ${usage.totalTokens ?? "unknown"}`,
    "",
  ].join("\n");
}
