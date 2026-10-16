import type { PageContent, PageState } from "@codexsun/sites-api/page-contract";
export type { PageContent, PageState };
export type PageGateway = {
  get(uuid: string): Promise<PageState>;
  save(uuid: string, content: PageContent, revision: number): Promise<PageState>;
  publish(uuid: string, revision: number): Promise<PageState>;
  activity(
    uuid: string
  ): Promise<{ actor: string; action: string; revision: number; created_at: string }[]>;
};
