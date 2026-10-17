import { sql } from "kysely";

export type PaymentColumnSearch = {
  numberSearch?: string;
  dateSearch?: string;
  partySearch?: string;
  totalSearch?: string;
  statusSearch?: string;
  modeSearch?: string;
  unallocatedSearch?: string;
};

export function paymentColumnPredicate(filters: PaymentColumnSearch) {
  return sql`
    ${filters.numberSearch?.trim() ? sql`AND (r.payment_number LIKE ${`%${filters.numberSearch.trim()}%`})` : sql``}
    ${filters.dateSearch?.trim() ? sql`AND (DATE_FORMAT(r.payment_date, '%d-%m-%Y') LIKE ${`%${filters.dateSearch.trim()}%`})` : sql``}
    ${filters.partySearch?.trim() ? sql`AND (supplier.name LIKE ${`%${filters.partySearch.trim()}%`})` : sql``}
    ${filters.totalSearch?.trim() ? sql`AND (CAST(r.total_amount AS CHAR) LIKE ${`%${filters.totalSearch.trim()}%`})` : sql``}
    ${filters.statusSearch?.trim() ? sql`AND (r.status LIKE ${`%${filters.statusSearch.trim()}%`})` : sql``}
    ${filters.modeSearch?.trim() ? sql`AND (r.payment_mode LIKE ${`%${filters.modeSearch.trim()}%`})` : sql``}
    ${filters.unallocatedSearch?.trim() ? sql`AND (CAST(r.unallocated_amount AS CHAR) LIKE ${`%${filters.unallocatedSearch.trim()}%`})` : sql``}
  `;
}
