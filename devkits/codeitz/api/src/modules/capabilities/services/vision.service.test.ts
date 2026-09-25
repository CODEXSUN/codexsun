import { describe, it, beforeEach, afterEach } from "node:test";
import { VisionService } from "./vision.service.js";
import { BoundaryViolationError } from "../../../middleware/error-handler.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert";

describe("VisionService", () => {
  let service: VisionService;
  let testDir: string;

  beforeEach(() => {
    testDir = resolve("/tmp/test-vision-service");
    mkdirSync(testDir, { recursive: true });
    service = new VisionService(testDir);
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("resolveSafeWorkspacePath", () => {
    it("should resolve valid paths within workspace", () => {
      const result = service.resolveSafeWorkspacePath("test/file.txt");
      assert.strictEqual(result.includes(testDir), true);
      assert.strictEqual(result.replace(/\\/g, "/").includes("test/file.txt"), true);
    });

    it("should resolve absolute paths within workspace", () => {
      const result = service.resolveSafeWorkspacePath(resolve(testDir, "test/file.txt"));
      assert.strictEqual(result.includes(testDir), true);
    });

    it("should throw BoundaryViolationError for paths outside workspace", () => {
      assert.throws(() => service.resolveSafeWorkspacePath("../outside.txt"), BoundaryViolationError);
    });

    it("should throw BoundaryViolationError for absolute paths outside workspace", () => {
      assert.throws(() => service.resolveSafeWorkspacePath("/etc/passwd"), BoundaryViolationError);
    });

    it("should throw BoundaryViolationError for drive traversal on Windows", () => {
      assert.throws(() => service.resolveSafeWorkspacePath("D:\\other\\file.txt"), BoundaryViolationError);
    });

    it("should handle relative paths with multiple levels", () => {
      const result = service.resolveSafeWorkspacePath("deep/nested/path/file.txt");
      assert.strictEqual(result.includes(testDir), true);
      assert.strictEqual(result.replace(/\\/g, "/").includes("deep/nested/path/file.txt"), true);
    });
  });

  describe("analyzeVision", () => {
    it("should handle missing files gracefully", async () => {
      const result = await service.analyzeVision({ filename: "nonexistent.png", imageData: "" });
      assert.strictEqual(result.filename, "nonexistent.png");
      assert.strictEqual(Array.isArray(result.detectedElements), true);
      assert.strictEqual(Array.isArray(result.layoutHierarchy), true);
    });

    it("should detect PNG dimensions", async () => {
      // Create a minimal valid PNG file
      const pngPath = resolve(testDir, "test.png");
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x64, // width: 100
        0x00, 0x00, 0x00, 0x64, // height: 100
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
        0x00, 0x00, 0x00, 0x00, // CRC
        0x49, 0x45, 0x4E, 0x44, // IEND
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x00, 0x00, 0x00, 0x00, // CRC
      ]);
      writeFileSync(pngPath, pngHeader);

      const result = await service.analyzeVision({ filename: "test.png", imageData: pngHeader.toString("base64") });
      assert.strictEqual(result.detectedElements.some(el => el.includes("100x100")), true);
    });

    it("should parse SVG dimensions", async () => {
      const svgPath = resolve(testDir, "test.svg");
      const svgContent = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"></svg>`;
      writeFileSync(svgPath, svgContent);

      const result = await service.analyzeVision({ filename: "test.svg", imageData: Buffer.from(svgContent).toString("base64") });
      assert.strictEqual(result.detectedElements.some(el => el.includes("200x150")), true);
    });

    it("should reject files exceeding size limit", async () => {
      const largePath = resolve(testDir, "large.png");
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      writeFileSync(largePath, largeBuffer);

      await assert.rejects(
        () => service.analyzeVision({ filename: "large.png", imageData: largeBuffer.toString("base64") }),
        /exceeds maximum 10MB limit/
      );
    });

    it("should throw BoundaryViolationError for files outside workspace", async () => {
      await assert.rejects(
        () => service.analyzeVision({ filename: "/etc/passwd", imageData: "" }),
        BoundaryViolationError
      );
    });

    it("should provide default layout hierarchy", async () => {
      const result = await service.analyzeVision({ filename: "test.png", imageData: "" });
      assert.strictEqual(result.layoutHierarchy.includes("Header > Stepper > StatusPill"), true);
      assert.strictEqual(result.layoutHierarchy.includes("Main > SplitPane > ChatStream + ActionInspector"), true);
    });

    it("should provide OCR text output", async () => {
      const result = await service.analyzeVision({ filename: "test.png", imageData: "" });
      assert.strictEqual(result.ocrExtractedText.includes("Codeitz Autonomous SWE Studio"), true);
    });
  });
});
