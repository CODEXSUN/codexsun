import {
  companyListResponseSchema,
  type CompanyListResponse,
} from "../../shared/index.js"

import { companies } from "../data/core-seed.js"

export function listCompanies(): CompanyListResponse {
  return companyListResponseSchema.parse({
    items: companies,
  })
}
