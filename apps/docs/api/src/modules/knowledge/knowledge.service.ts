import { AppError } from "@codexsun/framework/errors";
import { KnowledgeRepository } from "./knowledge.repository.js";
import { knowledgeSources, readKnowledgeSource, referenceExcerpt } from "./knowledge.content.js";
import type { KnowledgeContext, KnowledgeInput, DeveloperReference } from "./knowledge.types.js";
export class KnowledgeService {
  private readonly repository: KnowledgeRepository;
  constructor(private readonly context: KnowledgeContext) {
    this.repository = new KnowledgeRepository(context.database);
  }
  async catalog() {
    await this.context.authorize("docs.knowledge.view");
    const sources = await knowledgeSources();
    const keys = new Set(sources.map((s) => s.pageKey));
    return (await this.repository.list()).filter((p) => keys.has(p.pageKey));
  }
  async page(uuid: string) {
    await this.context.authorize("docs.knowledge.view");
    const record = await this.repository.get(uuid);
    const source = (await knowledgeSources()).find((s) => s.pageKey === record.pageKey);
    if (!source) throw AppError.notFound("Repository documentation source is not available.");
    const { bodyOverride, ...meta } = record;
    return {
      ...meta,
      body: bodyOverride ?? (await readKnowledgeSource(source)),
      format:
        bodyOverride !== null
          ? ("md" as const)
          : source.sourcePath.endsWith(".mdx")
            ? ("mdx" as const)
            : ("md" as const),
      origin: bodyOverride !== null ? ("database" as const) : ("repository" as const),
      activity: await this.repository.activity(uuid)
    };
  }
  async save(uuid: string, input: KnowledgeInput) {
    await this.context.authorize("docs.knowledge.view");
    await this.context.authorize("docs.knowledge.edit");
    await this.repository.update(uuid, input, this.context.actorEmail);
    return this.page(uuid);
  }
  async references(query: string): Promise<DeveloperReference[]> {
    const term = query.trim().toLowerCase();
    const pages = (await this.catalog())
      .filter((p) =>
        `${p.appKey} ${p.title} ${p.summary} ${p.moduleKey}`.toLowerCase().includes(term)
      )
      .sort(
        (a, b) =>
          Number(b.appKey === term) * 100 +
            Number(b.title.toLowerCase().includes(term)) * 40 -
            (Number(a.appKey === term) * 100 + Number(a.title.toLowerCase().includes(term)) * 40) ||
          a.sortOrder - b.sortOrder
      )
      .slice(0, 5);
    return Promise.all(
      pages.map(async (p) => {
        const detail = await this.page(p.uuid);
        return {
          title: p.title,
          pageKey: p.pageKey,
          url: `/app/docs/library?page=${encodeURIComponent(p.pageKey)}`,
          sourcePath: p.sourcePath,
          sourceHash: p.sourceHash,
          revision: p.revision,
          origin: detail.origin,
          excerpt: referenceExcerpt(detail.body, query)
        };
      })
    );
  }
}
