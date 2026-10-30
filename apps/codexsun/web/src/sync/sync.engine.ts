import type { RequirementRecord } from "../modules/requirements";
import { codexsunScopeKey } from "./sync.types";
import type {
  CodexsunDraft,
  CodexsunSyncGateway,
  CodexsunSyncScope,
  CodexsunSyncStorage
} from "./sync.types";

export class CodexsunSyncEngine {
  private cycle: Promise<void> | null = null;

  constructor(
    private readonly scope: CodexsunSyncScope,
    private readonly gateway: CodexsunSyncGateway,
    private readonly storage: CodexsunSyncStorage,
    private readonly isCurrent: () => boolean
  ) {}

  async saveDraft(draft: CodexsunDraft): Promise<void> {
    this.assertCurrent();
    if (
      !/^[A-Za-z0-9_-]{8,64}$/.test(draft.clientKey) ||
      !draft.title.trim() ||
      draft.title.length > 200 ||
      !draft.description.trim() ||
      draft.description.length > 20000 ||
      !["low", "normal", "high", "urgent"].includes(draft.priority) ||
      !["web", "desktop", "mobile"].includes(draft.origin)
    ) {
      throw new Error("Enter a valid title, description, priority and portal before saving.");
    }
    const content: CodexsunDraft = {
      clientKey: draft.clientKey,
      title: draft.title.trim(),
      description: draft.description.trim(),
      priority: draft.priority,
      origin: draft.origin
    };
    const pending = (await this.storage.list()).find(
      (entry) => entry.draft.clientKey === content.clientKey
    );
    this.assertCurrent();
    if (pending) {
      if (JSON.stringify(pending.draft) !== JSON.stringify(content))
        throw new Error("This draft is already queued. Save a new draft for different content.");
      return;
    }
    await this.storage.put({ draft: content, queuedAt: new Date().toISOString() });
  }

  sync(): Promise<void> {
    if (this.cycle) return this.cycle;
    this.cycle = this.run().finally(() => {
      this.cycle = null;
    });
    return this.cycle;
  }

  private async run(): Promise<void> {
    await this.checkContext();
    const entries = await this.storage.list();
    entries.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
    for (const entry of entries) {
      await this.checkContext();
      await this.gateway.post("/codexsun/requirements", entry.draft);
      this.assertCurrent();
      await this.storage.acknowledge(entry.draft.clientKey);
    }
    await this.checkContext();
    const response = await this.gateway.get<{ records: RequirementRecord[] }>(
      "/codexsun/requirements?page=1&pageSize=100"
    );
    this.assertCurrent();
    await this.storage.writeCache({
      records: response.records,
      syncedAt: new Date().toISOString()
    });
  }

  private async checkContext(): Promise<void> {
    this.assertCurrent();
    const context = await this.gateway.get<CodexsunSyncScope>("/codexsun/context");
    this.assertCurrent();
    if (codexsunScopeKey(context) !== codexsunScopeKey(this.scope)) {
      throw new Error("Account changed. Reopen the workspace before syncing.");
    }
  }

  private assertCurrent(): void {
    if (!this.isCurrent())
      throw new Error("Workspace changed. Pending drafts remain in their original account.");
  }
}
