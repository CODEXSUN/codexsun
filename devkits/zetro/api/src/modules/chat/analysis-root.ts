import { realpath } from "node:fs/promises";
import { lstatSync } from "node:fs";
import { parse, resolve } from "node:path";

const pathExpression = /(?:[A-Za-z]:\\[^\r\n"'<>|?*]+|\\\\[^\r\n"'<>|?*]+)/;

export type AnalysisRoot = { path: string; prompt: string };

export async function findAnalysisRoot(prompt: string): Promise<AnalysisRoot | undefined> {
  const candidate = prompt.match(pathExpression)?.[0]?.trim();
  if (!candidate) return undefined;
  const root = parse(candidate).root;
  if (resolve(candidate) === root) throw new Error("Choose a project folder, not a drive root.");
  const path = await realpath(candidate);
  if (!lstatSync(path).isDirectory()) throw new Error("The supplied analysis path is not a folder.");
  return { path, prompt: analysisPrompt(path) };
}

function analysisPrompt(path: string): string {
  return `The user asked to analyze the accepted local folder: ${path}. Work only inside this root in read-only mode. Inspect relevant source files and subfolders recursively. Do not modify files, create tasks, install packages, use network access, or read .env files, secrets, .git, node_modules, generated output, or binaries. Give an evidence-backed analysis: product and architecture summary, confirmed strengths, gaps, friction, blockers, and 2-3 ideas ranked by user value, likely effort, confidence, risks, and file-path evidence. Clearly mark inferences.`;
}
