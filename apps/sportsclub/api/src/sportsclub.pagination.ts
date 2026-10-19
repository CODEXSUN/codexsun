/**
 * @file Server-side pagination, inline search, filters, and selectable column contracts
 *
 * Implements strict pagination controls (page size exactly 100, metadata returned only when total > 100)
 * across all Sportsclub backend record lists. Full safe backend row contracts are preserved across
 * all modules, with selectable columns contracts provided for UI presentation.
 */

import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 100;
export const PAGINATION_THRESHOLD = 100;

export const paginationMetadataSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
});

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;

export const baseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
  columns: z.string().trim().optional()
});

export type BaseListQuery = {
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  columns?: string | undefined;
};

export function createListResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.strictObject({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    pagination: paginationMetadataSchema.nullable()
  });
}

export type ListResponse<T> = {
  items: T[];
  total: number;
  pagination: PaginationMetadata | null;
};

/**
 * Calculates pagination controls and metadata.
 * Strict invariant: returns null when total <= 100.
 * Always strictly uses 100 rows per page.
 */
export function calculatePagination(
  total: number,
  page: number = 1,
  _pageSize: number = DEFAULT_PAGE_SIZE
): PaginationMetadata | null {
  if (total <= PAGINATION_THRESHOLD) {
    return null;
  }
  const safePageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1
  };
}

export function parseSelectableColumns<T extends string>(
  columnsInput: string | undefined,
  allowedColumns: readonly T[]
): T[] | null {
  if (!columnsInput || !columnsInput.trim()) return null;
  const requested = columnsInput
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is T => (allowedColumns as readonly string[]).includes(c));
  return requested.length > 0 ? requested : null;
}
