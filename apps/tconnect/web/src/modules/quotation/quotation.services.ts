import type { TconnectGateway } from "../../workspace.types";
export const loadQuotations = (gateway: TconnectGateway, conversationUuid?: string) =>
  gateway.quotation.list(conversationUuid);
