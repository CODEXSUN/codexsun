export const DEFAULT_PAGE_SIZE = 100;
export const PAGINATION_THRESHOLD = 100;

export type PaginationMetadata = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  pagination: PaginationMetadata | null;
};
