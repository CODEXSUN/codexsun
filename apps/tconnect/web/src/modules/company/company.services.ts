import { publicRequest } from "../../transport";
import type { Company } from "./company.types";
export const getCompany = () => publicRequest<Company[]>("/public/tconnect/company");
