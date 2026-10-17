import { publicRequest } from "../../transport";
import type { z } from "zod";
import { memberRegistration } from "./member.schema";
export const registrationContext = () =>
  publicRequest<{ corporateId: string }>("/public/tconnect/registration");
export const registerMember = (input: z.infer<typeof memberRegistration>) =>
  publicRequest<{ uuid: string; companyUuid: string; membershipStatus: string }>(
    "/public/tconnect/registration",
    input
  );
declare const __CODEXSUN_PLATFORM_WEB_ORIGIN__: string;
declare const __CODEXSUN_PLATFORM_WEB_PORT__: number;
export function memberLoginUrl(corporateId?: string) {
  const local = import.meta.env.DEV && ["127.0.0.1", "localhost"].includes(location.hostname);
  const base = local
    ? `${location.protocol}//${location.hostname}:${__CODEXSUN_PLATFORM_WEB_PORT__}`
    : __CODEXSUN_PLATFORM_WEB_ORIGIN__;
  const url = new URL("/login", base);
  url.searchParams.set("app", "tconnect");
  if (corporateId) url.searchParams.set("corporateId", corporateId);
  return url.href;
}
