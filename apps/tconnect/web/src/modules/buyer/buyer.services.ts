import { publicRequest } from "../../transport";
import type { z } from "zod";
import type { buyerRegistration } from "./buyer.schema";
import { memberLoginUrl } from "../member/member.services";
export const registerBuyer = (input: z.infer<typeof buyerRegistration>) =>
  publicRequest<{ uuid: string }>("/public/tconnect/buyer/registration", input);
export function buyerLoginUrl(corporateId?: string) {
  const url = new URL(memberLoginUrl(corporateId));
  url.searchParams.set("account", "buyer");
  return url.href;
}
