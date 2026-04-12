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

Format responses with clear sections.`,
  audit: `You are a code review assistant. Provide structured audit responses including:
- Intent verified
- Assumptions documented
- Approvals needed
- Command log
- Findings
- Decisions made
- Follow-up items

Be thorough. Every claim must be verifiable.`,
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
): string {
  const modePrompt =
    OUTPUT_MODE_SYSTEM_PROMPTS[outputMode] ?? OUTPUT_MODE_SYSTEM_PROMPTS.normal;
  const guardrail = SAFETY_GUARDRAIL_PROMPT;

  let contextPrompt = "";

  if (context) {
    const parts: string[] = [];

    if (context.workspacePath) {
      parts.push(`Workspace: ${context.workspacePath}`);
    }

    if (context.currentFile) {
      parts.push(`Current file: ${context.currentFile}`);
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

    if (parts.length > 0) {
      contextPrompt = `\n\nContext:\n${parts.join("\n")}`;
    }
  }

  return `${modePrompt}${guardrail}${contextPrompt}`;
}

export function buildPromptFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  outputMode: ZetroOutputModeId,
  context?: ZetroPromptContext,
): ZetroModelMessage[] {
  const systemContent = buildSystemPrompt(outputMode, context);

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

export function stripCommandExecution(content: string): string {
  return content
    .replace(/```bash\n.*?```/gs, "[command proposal]")
    .replace(/```sh\n.*?```/gs, "[command proposal]")
    .replace(/```shell\n.*?```/gs, "[command proposal]")
    .replace(
      /(?:npm|yarn|pnpm|npx|node|python|pip|git|make|docker|kubectl)\s+[^\n]+/g,
      "[command proposal]",
    );
}
