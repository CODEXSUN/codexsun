import type { PageContent, PageState } from "@codexsun/sites-api/page-contract";
export type { PageContent, PageState };
export type PageGateway = {
  companyPhones?(): Promise<{ id: number; name: string; phone: string }[]>;
  get(uuid: string): Promise<PageState>;
  save(uuid: string, content: PageContent, revision: number): Promise<PageState>;
  publish(uuid: string, revision: number): Promise<PageState>;
  activity(
    uuid: string
  ): Promise<{ actor: string; action: string; revision: number; created_at: string }[]>;
};
