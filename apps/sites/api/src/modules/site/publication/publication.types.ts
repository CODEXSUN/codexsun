import type { Generated } from "kysely";
export type PublicationDatabase = {
  sites_publications: {
    id: Generated<number>;
    site_id: number;
    checksum: string;
    payload_json: string;
    actor: string;
    created_at: string;
  };
};
export type PublicationOwner = { id: number; uuid: string; slug: string; status: string };
