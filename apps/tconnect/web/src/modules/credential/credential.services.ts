import { publicRequest } from "../../transport";
import type { PublicCredential } from "./credential.types";
export const publicCredentials = () =>
  publicRequest<PublicCredential[]>("/public/tconnect/credential");
