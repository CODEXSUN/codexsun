import { z } from "zod";

export const capabilityIdSchema = z.enum([
  "web_search",
  "browser_automation",
  "vision",
  "image_generation",
  "text_to_speech",
  "voice_to_text",
  "multi_model_reasoning",
  "computer_use",
  "excel_analysis",
  "pdf_analysis",
  "prompt_spelling_corrections",
]);

export type CapabilityId = z.infer<typeof capabilityIdSchema>;

export const capabilityDefinitionSchema = z.object({
  id: capabilityIdSchema,
  name: z.string(),
  description: z.string(),
  category: z.enum(["core", "multimodal", "reasoning", "automation"]),
  icon: z.string(),
  enabled: z.boolean().default(true),
  supportedFormats: z.array(z.string()).optional(),
});

export type CapabilityDefinition = z.infer<typeof capabilityDefinitionSchema>;

// 1. Prompt Spelling Corrections
export const promptSpellCheckInputSchema = z.object({
  prompt: z.string(),
});
export type PromptSpellCheckInput = z.infer<typeof promptSpellCheckInputSchema>;

export const promptCorrectionSchema = z.object({
  originalWord: z.string(),
  correctedWord: z.string(),
  offset: z.number(),
});
export type PromptCorrection = z.infer<typeof promptCorrectionSchema>;

export const promptSpellCheckResultSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  hasCorrections: z.boolean(),
  corrections: z.array(promptCorrectionSchema),
});
export type PromptSpellCheckResult = z.infer<typeof promptSpellCheckResultSchema>;

// 2. Web Search
export const webSearchInputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().int().positive().default(5).optional(),
});
export type WebSearchInput = z.infer<typeof webSearchInputSchema>;

export const webSearchResultItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  source: z.string(),
});
export type WebSearchResultItem = z.infer<typeof webSearchResultItemSchema>;

export const webSearchResultSchema = z.object({
  query: z.string(),
  totalResults: z.number(),
  results: z.array(webSearchResultItemSchema),
});
export type WebSearchResult = z.infer<typeof webSearchResultSchema>;

// 3. Browser Automation
export const browserAutomationInputSchema = z.object({
  action: z.enum(["navigate", "click", "extract", "screenshot", "evaluate"]),
  url: z.string().optional(),
  selector: z.string().optional(),
  script: z.string().optional(),
});
export type BrowserAutomationInput = z.infer<typeof browserAutomationInputSchema>;

export const browserAutomationResultSchema = z.object({
  action: z.string(),
  status: z.enum(["ok", "failed"]),
  pageTitle: z.string(),
  url: z.string(),
  domSnapshot: z.string().optional(),
  logs: z.array(z.string()).default([]),
});
export type BrowserAutomationResult = z.infer<typeof browserAutomationResultSchema>;

// 4. Vision
export const visionAnalysisInputSchema = z.object({
  imageData: z.string().min(1),
  filename: z.string().optional(),
  prompt: z.string().optional(),
});
export type VisionAnalysisInput = z.infer<typeof visionAnalysisInputSchema>;

export const visionAnalysisResultSchema = z.object({
  filename: z.string(),
  visualSummary: z.string(),
  detectedElements: z.array(z.string()),
  ocrExtractedText: z.string(),
  layoutHierarchy: z.array(z.string()).default([]),
});
export type VisionAnalysisResult = z.infer<typeof visionAnalysisResultSchema>;

// 5. Image Generation
export const imageGenerationInputSchema = z.object({
  prompt: z.string().min(1),
  style: z.enum(["mockup", "diagram", "wireframe", "architecture", "flowchart"]).default("diagram").optional(),
  aspectRatio: z.enum(["1:1", "16:9", "4:3"]).default("16:9").optional(),
});
export type ImageGenerationInput = z.infer<typeof imageGenerationInputSchema>;

export const imageGenerationResultSchema = z.object({
  prompt: z.string(),
  style: z.string(),
  imageUrl: z.string(),
  svgData: z.string().optional(),
  description: z.string(),
});
export type ImageGenerationResult = z.infer<typeof imageGenerationResultSchema>;

// 6. Text-to-Speech
export const textToSpeechInputSchema = z.object({
  text: z.string().min(1),
  voice: z.enum(["studio-natural", "code-engineer", "concise-narrator"]).default("studio-natural").optional(),
  speed: z.number().min(0.5).max(2.0).default(1.0).optional(),
});
export type TextToSpeechInput = z.infer<typeof textToSpeechInputSchema>;

export const textToSpeechResultSchema = z.object({
  text: z.string(),
  spokenSsml: z.string(),
  voice: z.string(),
  speed: z.number(),
  durationEstimateSec: z.number(),
  audioUrl: z.string(),
});
export type TextToSpeechResult = z.infer<typeof textToSpeechResultSchema>;

// 7. Multi-Model Reasoning
export const multiModelReasoningInputSchema = z.object({
  prompt: z.string().min(1),
  models: z
    .array(z.string())
    .default(["Gemini 3.8 Flash", "Claude 3.5 Sonnet", "DeepSeek-R1"])
    .optional(),
  consensusMode: z.boolean().default(true).optional(),
});
export type MultiModelReasoningInput = z.infer<typeof multiModelReasoningInputSchema>;

export const modelEvaluationSchema = z.object({
  model: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  recommendedAction: z.string(),
});
export type ModelEvaluation = z.infer<typeof modelEvaluationSchema>;

export const multiModelReasoningResultSchema = z.object({
  prompt: z.string(),
  consensusScore: z.number().min(0).max(1),
  selectedModel: z.string(),
  evaluations: z.array(modelEvaluationSchema),
  synthesizedConclusion: z.string(),
});
export type MultiModelReasoningResult = z.infer<typeof multiModelReasoningResultSchema>;

// 8. Computer Use
export const computerUseInputSchema = z.object({
  action: z.enum(["terminal_exec", "mouse_click", "key_combination", "window_focus"]),
  command: z.string().optional(),
  coordinates: z.object({ x: z.number(), y: z.number() }).optional(),
  keys: z.string().optional(),
});
export type ComputerUseInput = z.infer<typeof computerUseInputSchema>;

export const computerUseResultSchema = z.object({
  action: z.string(),
  success: z.boolean(),
  output: z.string(),
  sandboxStatus: z.string(),
  auditLog: z.string(),
});
export type ComputerUseResult = z.infer<typeof computerUseResultSchema>;

// 9. Excel Analysis
export const excelAnalysisInputSchema = z.object({
  filename: z.string().min(1),
  csvContent: z.string().optional(),
  instruction: z.string().optional(),
});
export type ExcelAnalysisInput = z.infer<typeof excelAnalysisInputSchema>;

export const excelAnalysisResultSchema = z.object({
  filename: z.string(),
  rowCount: z.number(),
  columnCount: z.number(),
  headers: z.array(z.string()),
  summaryMetrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  insights: z.array(z.string()),
  formulaAudit: z.array(z.string()),
});
export type ExcelAnalysisResult = z.infer<typeof excelAnalysisResultSchema>;

// 10. PDF Analysis
export const pdfAnalysisInputSchema = z.object({
  filename: z.string().min(1),
  textContent: z.string().optional(),
  instruction: z.string().optional(),
});
export type PdfAnalysisInput = z.infer<typeof pdfAnalysisInputSchema>;

export const pdfSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export type PdfSection = z.infer<typeof pdfSectionSchema>;

export const pdfAnalysisResultSchema = z.object({
  filename: z.string(),
  pageCount: z.number(),
  sections: z.array(pdfSectionSchema),
  extractedRequirements: z.array(z.string()),
  summary: z.string(),
});
export type PdfAnalysisResult = z.infer<typeof pdfAnalysisResultSchema>;

// 11. Voice to Text (Speech-to-Text)
export const voiceToTextInputSchema = z.object({
  audioData: z.string().optional(),
  mimeType: z.string().default("audio/webm").optional(),
  sampleRate: z.number().default(16000).optional(),
  language: z.string().default("en-US").optional(),
  simulatedTranscript: z.string().optional(),
});
export type VoiceToTextInput = z.infer<typeof voiceToTextInputSchema>;

export const voiceToTextResultSchema = z.object({
  transcript: z.string(),
  confidence: z.number(),
  language: z.string(),
  durationSec: z.number(),
});
export type VoiceToTextResult = z.infer<typeof voiceToTextResultSchema>;
