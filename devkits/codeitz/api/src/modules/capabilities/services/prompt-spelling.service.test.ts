import { describe, it, beforeEach } from "node:test";
import { PromptSpellingService } from "./prompt-spelling.service.js";
import assert from "node:assert";

describe("PromptSpellingService", () => {
  let service: PromptSpellingService;

  beforeEach(() => {
    service = new PromptSpellingService();
  });

  describe("checkPromptSpelling", () => {
    it("should detect common SWE typos", () => {
      const result = service.checkPromptSpelling({ prompt: "I need to implment this fucntion" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("implement"), true);
      assert.strictEqual(result.corrected.includes("function"), true);
    });

    it("should preserve case pattern", () => {
      const result = service.checkPromptSpelling({ prompt: "IMPLMENT this Function" });
      assert.strictEqual(result.corrected.includes("IMPLEMENT"), true);
      assert.strictEqual(result.corrected.includes("Function"), true);
    });

    it("should handle capitalized words", () => {
      const result = service.checkPromptSpelling({ prompt: "Implment this function" });
      assert.strictEqual(result.corrected.includes("Implement"), true);
    });

    it("should return original if no typos found", () => {
      const result = service.checkPromptSpelling({ prompt: "Implement this function correctly" });
      assert.strictEqual(result.hasCorrections, false);
      assert.strictEqual(result.corrected, "Implement this function correctly");
    });

    it("should handle multiple typos in one sentence", () => {
      const result = service.checkPromptSpelling({ prompt: "I need to implment this fucntion and refactorr the code" });
      assert.strictEqual(result.corrections.length >= 2, true);
    });

    it("should handle authentication typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Authntication failed" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("Authentication"), true);
    });

    it("should handle database typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Connect to databse" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("database"), true);
    });

    it("should handle environment typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Set up the enviroment" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("environment"), true);
    });

    it("should handle deployment typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Deploye the application" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("Deploy"), true);
    });

    it("should provide correction offsets", () => {
      const result = service.checkPromptSpelling({ prompt: "implment this" });
      assert.strictEqual(result.corrections[0].offset !== undefined, true);
      assert.strictEqual(result.corrections[0].originalWord, "implment");
      assert.strictEqual(result.corrections[0].correctedWord, "implement");
    });

    it("should handle empty string", () => {
      const result = service.checkPromptSpelling({ prompt: "" });
      assert.strictEqual(result.hasCorrections, false);
      assert.strictEqual(result.corrected, "");
    });

    it("should handle special characters and punctuation", () => {
      const result = service.checkPromptSpelling({ prompt: "implment, this; fucntion!" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("implement"), true);
      assert.strictEqual(result.corrected.includes("function"), true);
    });

    it("should handle common word typos", () => {
      const result = service.checkPromptSpelling({ prompt: "teh quick brown fox" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("the"), true);
    });

    it("should handle architecture typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Review the architechture" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("architecture"), true);
    });

    it("should handle verification typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Run verifcation tests" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("verification"), true);
    });

    it("should handle autonomous typos", () => {
      const result = service.checkPromptSpelling({ prompt: "Enable autonomus mode" });
      assert.strictEqual(result.hasCorrections, true);
      assert.strictEqual(result.corrected.includes("autonomous"), true);
    });
  });
});
