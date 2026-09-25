import type { PromptSpellCheckInput, PromptSpellCheckResult, PromptCorrection } from "../contracts/capabilities-contracts.js";

const COMMON_SWE_TYPOS: Record<string, string> = {
  refactorr: "refactor",
  refactr: "refactor",
  authntication: "authentication",
  authenticaiton: "authentication",
  authenication: "authentication",
  implment: "implement",
  impliment: "implement",
  fucntion: "function",
  funciton: "function",
  databse: "database",
  databae: "database",
  reponse: "response",
  respone: "response",
  compnent: "component",
  componant: "component",
  recieved: "received",
  seperate: "separate",
  separete: "separate",
  enque: "enqueue",
  enqueu: "enqueue",
  schedular: "scheduler",
  teh: "the",
  accross: "across",
  dependancy: "dependency",
  dependecy: "dependency",
  verifcation: "verification",
  verifaction: "verification",
  architechture: "architecture",
  archtecture: "architecture",
  enviroment: "environment",
  succesful: "successful",
  occurance: "occurrence",
  optmize: "optimize",
  optmization: "optimization",
  deply: "deploy",
  deploye: "deploy",
  interative: "interactive",
  autonomus: "autonomous",
  exection: "execution",
  permisson: "permission",
  analysys: "analysis",
  automaton: "automation",
  speach: "speech",
  reashoning: "reasoning",
  exel: "excel",
  brower: "browser",
  broswer: "browser",
  vison: "vision",
};

export class PromptSpellingService {
  checkPromptSpelling(input: PromptSpellCheckInput): PromptSpellCheckResult {
    const original = input.prompt;
    const words = original.split(/(\s+|[.,;!?()[\]{}'"])/);
    const corrections: PromptCorrection[] = [];
    let offset = 0;

    const correctedParts = words.map((token) => {
      const lower = token.toLowerCase();
      const currentOffset = offset;
      offset += token.length;

      if (COMMON_SWE_TYPOS[lower]) {
        const replacement = COMMON_SWE_TYPOS[lower];
        // Match original case pattern
        const isUpper = token === token.toUpperCase();
        const isCapitalized = token[0] === token[0].toUpperCase() && token.slice(1) === token.slice(1).toLowerCase();
        const adjustedReplacement = isUpper
          ? replacement.toUpperCase()
          : isCapitalized
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;

        corrections.push({
          originalWord: token,
          correctedWord: adjustedReplacement,
          offset: currentOffset,
        });
        return adjustedReplacement;
      }
      return token;
    });

    const corrected = correctedParts.join("");
    return {
      original,
      corrected,
      hasCorrections: corrections.length > 0,
      corrections,
    };
  }
}
