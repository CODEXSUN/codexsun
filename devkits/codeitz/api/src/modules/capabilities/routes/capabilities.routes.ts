import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  browserAutomationInputSchema,
  browserAutomationResultSchema,
  capabilityDefinitionSchema,
  computerUseInputSchema,
  computerUseResultSchema,
  excelAnalysisInputSchema,
  excelAnalysisResultSchema,
  imageGenerationInputSchema,
  imageGenerationResultSchema,
  multiModelReasoningInputSchema,
  multiModelReasoningResultSchema,
  pdfAnalysisInputSchema,
  pdfAnalysisResultSchema,
  promptSpellCheckInputSchema,
  promptSpellCheckResultSchema,
  textToSpeechInputSchema,
  textToSpeechResultSchema,
  visionAnalysisInputSchema,
  visionAnalysisResultSchema,
  voiceToTextInputSchema,
  voiceToTextResultSchema,
  webSearchInputSchema,
  webSearchResultSchema,
} from "../contracts/capabilities-contracts.js";
import { CapabilitiesService } from "../service/capabilities.service.js";

export function registerCapabilitiesRoutes(
  app: FastifyInstance,
  service: CapabilitiesService,
  prefix: string = "/api/v1/codeitz/capabilities",
): void {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // 0. List all capabilities
  server.get(
    `${prefix}`,
    {
      schema: {
        response: {
          200: z.array(capabilityDefinitionSchema),
        },
        tags: ["Capabilities System"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listCapabilities());
    },
  );

  // 1. Prompt Spelling Correction
  server.post(
    `${prefix}/spellcheck`,
    {
      schema: {
        body: promptSpellCheckInputSchema,
        response: {
          200: promptSpellCheckResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      return reply.send(service.checkPromptSpelling(request.body));
    },
  );

  // 2. Web Search
  server.post(
    `${prefix}/web-search`,
    {
      schema: {
        body: webSearchInputSchema,
        response: {
          200: webSearchResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.performWebSearch(request.body);
      return reply.send(result);
    },
  );

  // 3. Browser Automation
  server.post(
    `${prefix}/browser`,
    {
      schema: {
        body: browserAutomationInputSchema,
        response: {
          200: browserAutomationResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.runBrowserAutomation(request.body);
      return reply.send(result);
    },
  );

  // 4. Vision
  server.post(
    `${prefix}/vision`,
    {
      schema: {
        body: visionAnalysisInputSchema,
        response: {
          200: visionAnalysisResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.analyzeVision(request.body);
      return reply.send(result);
    },
  );

  // 5. Image Generation
  server.post(
    `${prefix}/image-generation`,
    {
      schema: {
        body: imageGenerationInputSchema,
        response: {
          200: imageGenerationResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.generateImage(request.body);
      return reply.send(result);
    },
  );

  // 6. Text to Speech
  server.post(
    `${prefix}/tts`,
    {
      schema: {
        body: textToSpeechInputSchema,
        response: {
          200: textToSpeechResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.synthesizeSpeech(request.body);
      return reply.send(result);
    },
  );

  // 7. Multi-Model Reasoning
  server.post(
    `${prefix}/multi-model`,
    {
      schema: {
        body: multiModelReasoningInputSchema,
        response: {
          200: multiModelReasoningResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.reasonMultiModel(request.body);
      return reply.send(result);
    },
  );

  // 8. Computer Use
  server.post(
    `${prefix}/computer-use`,
    {
      schema: {
        body: computerUseInputSchema,
        response: {
          200: computerUseResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.performComputerUse(request.body);
      return reply.send(result);
    },
  );

  // 9. Excel Analysis
  server.post(
    `${prefix}/excel`,
    {
      schema: {
        body: excelAnalysisInputSchema,
        response: {
          200: excelAnalysisResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.analyzeExcel(request.body);
      return reply.send(result);
    },
  );

  // 10. PDF Analysis
  server.post(
    `${prefix}/pdf`,
    {
      schema: {
        body: pdfAnalysisInputSchema,
        response: {
          200: pdfAnalysisResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.analyzePdf(request.body);
      return reply.send(result);
    },
  );

  // 11. Voice to Text
  server.post(
    `${prefix}/voice-to-text`,
    {
      schema: {
        body: voiceToTextInputSchema,
        response: {
          200: voiceToTextResultSchema,
        },
        tags: ["Capabilities System"],
      },
    },
    async (request, reply) => {
      const result = await service.transcribeVoice(request.body);
      return reply.send(result);
    },
  );
}
