import { apiGet, apiPost, apiPut } from "../../shared/api/platform-api";
import type { TconnectGateway } from "@codexsun/tconnect-web";
declare const __CODEXSUN_TCONNECT_WEB_PORT__: number;
export const tconnectGateway: TconnectGateway = {
  message: {
    messages: (uuid, before) =>
      apiGet(
        `/tconnect/conversation/${uuid}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`,
        "tenant"
      ),
    send: (uuid, body) => apiPost(`/tconnect/conversation/${uuid}/messages`, { body }, "tenant")
  },
  conversation: {
    list: () => apiGet("/tconnect/conversation", "tenant"),
    get: (uuid) => apiGet(`/tconnect/conversation/${uuid}`, "tenant"),
    open: (input) => apiPost("/tconnect/conversation", input, "tenant")
  },
  quotation: {
    list: (uuid) =>
      apiGet(
        `/tconnect/quotation${uuid ? `?conversationUuid=${encodeURIComponent(uuid)}` : ""}`,
        "tenant"
      ),
    create: (input) => apiPost("/tconnect/quotation", input, "tenant"),
    withdraw: (uuid) => apiPut(`/tconnect/quotation/${uuid}/withdraw`, {}, "tenant")
  },
  buyer: {
    session: () => apiGet("/tconnect/buyer/session", "tenant"),
    search: (q) => apiGet(`/tconnect/product/search?q=${encodeURIComponent(q)}`, "tenant"),
    sent: () => apiGet("/tconnect/inquiry/sent", "tenant"),
    send: (input) => apiPost("/tconnect/inquiry/buyer", input, "tenant")
  },
  requirement: {
    list: () => apiGet("/tconnect/requirement", "tenant"),
    board: () => apiGet("/tconnect/requirement/board", "tenant"),
    save: (input, uuid) =>
      uuid
        ? apiPut(`/tconnect/requirement/${uuid}`, input, "tenant")
        : apiPost("/tconnect/requirement", input, "tenant")
  },
  product: {
    list: () => apiGet("/tconnect/product", "tenant"),
    save: (input, uuid) =>
      uuid
        ? apiPut(`/tconnect/product/${uuid}`, input, "tenant")
        : apiPost("/tconnect/product", input, "tenant")
  },
  member: {
    session: () => apiGet("/tconnect/member/session", "tenant"),
    list: () => apiGet("/tconnect/member", "tenant"),
    review: (uuid, input) => apiPut(`/tconnect/member/${uuid}`, input, "tenant"),
    associations: () => apiGet("/public/tconnect/association", "tenant")
  },
  publicPortalUrl: `${location.protocol}//${location.hostname}:${__CODEXSUN_TCONNECT_WEB_PORT__}`,
  company: {
    list: () => apiGet("/tconnect/company", "tenant"),
    save: (input, uuid) =>
      uuid
        ? apiPut(`/tconnect/company/${uuid}`, input, "tenant")
        : apiPost("/tconnect/company", input, "tenant")
  },
  association: {
    list: () => apiGet("/tconnect/association", "tenant"),
    save: (input, uuid) =>
      uuid
        ? apiPut(`/tconnect/association/${uuid}`, input, "tenant")
        : apiPost("/tconnect/association", input, "tenant")
  },
  community: {
    list: () => apiGet("/tconnect/community", "tenant"),
    save: (input, uuid) =>
      uuid
        ? apiPut(`/tconnect/community/${uuid}`, input, "tenant")
        : apiPost("/tconnect/community", input, "tenant")
  },
  inquiry: {
    list: () => apiGet("/tconnect/inquiry", "tenant"),
    setStatus: (uuid, status) => apiPut(`/tconnect/inquiry/${uuid}`, { status }, "tenant")
  }
};
