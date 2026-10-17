import { publicRequest } from "../../transport";
import type { Association } from "./association.types";
export const getAssociation = () => publicRequest<Association[]>("/public/tconnect/association");
