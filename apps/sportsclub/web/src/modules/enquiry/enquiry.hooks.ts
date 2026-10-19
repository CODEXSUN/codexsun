import { useQuery } from "@tanstack/react-query";
import { getEnquiry, listEnquiriesPage } from "./enquiry.services";
import type { EnquiryColumnFilters } from "./enquiry.types";

export const enquiryQueryKeys = {
  all: ["sportsclub", "enquiries"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: EnquiryColumnFilters;
  }) => ["sportsclub", "enquiries", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "enquiries", "detail", uuid] as const
};

export function useEnquiriesPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: EnquiryColumnFilters;
}) {
  return useQuery({
    queryKey: enquiryQueryKeys.list(options),
    queryFn: () => listEnquiriesPage(options)
  });
}

export function useEnquiryDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: enquiryQueryKeys.details(uuid ?? ""),
    queryFn: () => getEnquiry(uuid!),
    enabled: Boolean(uuid)
  });
}
