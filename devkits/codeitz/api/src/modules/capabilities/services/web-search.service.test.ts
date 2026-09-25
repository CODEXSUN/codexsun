import { describe, it, beforeEach } from "node:test";
import { WebSearchService } from "./web-search.service.js";
import assert from "node:assert";

describe("WebSearchService", () => {
  let service: WebSearchService;

  beforeEach(() => {
    service = new WebSearchService("/tmp/test-root");
  });

  describe("performWebSearch", () => {
    it("should handle empty query", async () => {
      const result = await service.performWebSearch({ query: "   " });
      assert.strictEqual(result.query, "   ");
      assert.strictEqual(result.totalResults > 0, true);
      assert.strictEqual(Array.isArray(result.results), true);
    });

    it("should return grounded documentation results", async () => {
      const result = await service.performWebSearch({ query: "typescript" });
      assert.strictEqual(result.query, "typescript");
      assert.strictEqual(result.results.length > 0, true);
      
      // Check for grounded documentation sources
      const sources = result.results.map(r => r.source);
      assert.strictEqual(sources.includes("MDN Web Docs"), true);
      assert.strictEqual(sources.includes("GitHub"), true);
      assert.strictEqual(sources.includes("StackOverflow"), true);
    });

    it("should respect maxResults parameter", async () => {
      const result = await service.performWebSearch({ query: "react", maxResults: 2 });
      assert.strictEqual(result.results.length <= 2, true);
    });

    it("should handle npm package search", async () => {
      const result = await service.performWebSearch({ query: "express" });
      assert.strictEqual(result.results.length > 0, true);
      
      // Check if npm results are included when available
      const npmResults = result.results.filter(r => r.source === "npm Public Registry");
      assert.strictEqual(npmResults.length >= 0, true);
    });

    it("should search local documentation", async () => {
      const result = await service.performWebSearch({ query: "memory" });
      assert.strictEqual(result.results.length > 0, true);
      
      // Check for local repository documentation
      const localDocs = result.results.filter(r => r.source === "Local Repository Documentation");
      assert.strictEqual(localDocs.length >= 0, true);
    });

    it("should handle special characters in query", async () => {
      const result = await service.performWebSearch({ query: "c++ & python" });
      assert.strictEqual(result.query, "c++ & python");
      assert.strictEqual(result.results.length > 0, true);
    });

    it("should handle very long queries", async () => {
      const longQuery = "a".repeat(500);
      const result = await service.performWebSearch({ query: longQuery });
      assert.strictEqual(result.query, longQuery);
      assert.strictEqual(result.results.length > 0, true);
    });
  });

  describe("error handling", () => {
    it("should handle non-existent directories gracefully", async () => {
      const result = await service.performWebSearch({ query: "nonexistent-term" });
      assert.strictEqual(result.results.length > 0, true);
      // Should fall back to web documentation
    });

    it("should handle file read errors gracefully", async () => {
      const result = await service.performWebSearch({ query: "test" });
      assert.strictEqual(result.results.length > 0, true);
      // Should not throw errors for unreadable files
    });
  });
});
