import type { TconnectGateway } from "../../workspace.types";
export const loadMessages = (gateway: TconnectGateway, uuid: string, before: string | null) =>
  gateway.message.messages(uuid, before ?? undefined);
