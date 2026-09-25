import type { ModuleProvider } from "@codexsun/framework";
import { MemoryBankService } from "./service/memory-bank.service.js";

export class CodeitzMemoryProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.memory",
    owner: "devkits/codeitz/api/modules/memory",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.memory.bank"],
    events: {
      published: [
        "codeitz.memory.section_updated",
        "codeitz.memory.entry_stored",
        "codeitz.memory.synced",
      ],
      consumed: ["codeitz.swe.verified", "codeitz.swe.task_created"],
    },
  };

  readonly service = new MemoryBankService();

  register(): void {}
}
