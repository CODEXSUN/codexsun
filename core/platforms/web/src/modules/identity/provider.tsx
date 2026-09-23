export { IdentitySessionProvider, useIdentitySession } from "./session/identity-session-provider";

export const identityWebModule = {
  id: "platform.web.identity",
  owner: "core/platforms/web/modules/identity",
  events: { published: [], consumed: [] },
};
