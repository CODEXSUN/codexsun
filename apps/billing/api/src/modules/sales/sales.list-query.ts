import { sql } from "kysely";

export type SaleColumnSearch = {
  numberSearch?: string;
  dateSearch?: string;
  partySearch?: string;
  totalSearch?: string;
  statusSearch?: string;
  quantitySearch?: string;
  taxableSearch?: string;
  taxSearch?: string;
};

export function salesColumnPredicate(filters: SaleColumnSearch) {
  return sql`
    ${filters.numberSearch?.trim() ? sql`AND (s.invoice_number LIKE ${`%${filters.numberSearch.trim()}%`})` : sql``}
    ${filters.dateSearch?.trim() ? sql`AND (DATE_FORMAT(s.issued_on, '%d-%m-%Y') LIKE ${`%${filters.dateSearch.trim()}%`})` : sql``}
    ${filters.partySearch?.trim() ? sql`AND (customer.name LIKE ${`%${filters.partySearch.trim()}%`})` : sql``}
    ${filters.totalSearch?.trim() ? sql`AND (CAST(s.amount AS CHAR) LIKE ${`%${filters.totalSearch.trim()}%`})` : sql``}
    ${filters.statusSearch?.trim() ? sql`AND (s.status LIKE ${`%${filters.statusSearch.trim()}%`})` : sql``}
    ${filters.quantitySearch?.trim() ? sql`AND (CAST((SELECT COALESCE(SUM(item.quantity),0) FROM billing_sales_items item WHERE item.sales_id=s.id) AS CHAR) LIKE ${`%${filters.quantitySearch.trim()}%`})` : sql``}
    ${filters.taxableSearch?.trim() ? sql`AND (CAST(s.subtotal AS CHAR) LIKE ${`%${filters.taxableSearch.trim()}%`})` : sql``}
    ${filters.taxSearch?.trim() ? sql`AND (CAST(s.tax_amount AS CHAR) LIKE ${`%${filters.taxSearch.trim()}%`})` : sql``}
  `;
}
