# Codeitz Capabilities Module

The Codeitz Capabilities module provides multi-modal and automated tools for autonomous software engineering tasks.

## Purpose

This module equips the Codeitz SWE system with real-time prompt spellcheck, grounded web search, browser automation, vision inspection, generative image mockups, text-to-speech narration, multi-model consensus reasoning, computer-use automation, spreadsheet/Excel data parsing, and technical PDF specification analysis.

## Registered Capabilities

The module registers and exposes 10 core capabilities:

1. **Prompt Spelling Corrections**: Fast dictionary and phonetic token analysis targeting common engineering and linguistic typos.
2. **Web Search**: Grounded external query execution against authoritative developer documentation and pattern repositories.
3. **Browser Automation**: Headless browser lifecycle orchestration, DOM snapshot capture, and E2E verification logging.
4. **Computer Vision**: Multi-modal structural analysis for UI screenshots, wireframes, and runtime defect inspection.
5. **Image Generation**: Automated synthesis of SVG architecture flowcharts, component interaction graphs, and mockups.
6. **Text-to-Speech (TTS)**: Acoustic synthesis of execution summaries, verbal code reviews, and hands-free notifications.
7. **Multi-Model Reasoning**: Consensus orchestration across Gemini 3.8 Flash, Claude 3.5 Sonnet, GPT-4o, and DeepSeek-R1.
8. **Computer Use**: Sandboxed OS-level automation for shell commands, keyboard entry, and window focus management.
9. **Excel & Spreadsheet Analysis**: Tabular data parsing, header extraction, numeric metrics computation, and formula auditing.
10. **PDF & Specification Analysis**: Multi-page document breakdown, section parsing, and requirements extraction.

## Contracts & Routes

All requests and responses are strictly validated via Zod schemas in `contracts/capabilities-contracts.ts` and mounted under `/api/v1/codeitz/capabilities`.
