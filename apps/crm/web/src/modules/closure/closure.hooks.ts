import { useQuery } from "@tanstack/react-query";
import { getEnquiryClosureState } from "./closure.services";

export const enquiryClosureQueryKey = (enquiryId: string) => [
  "crm",
  "enquiry",
  enquiryId,
  "closure"
];
export function useEnquiryClosureState(enquiryId: string) {
  return useQuery({
    queryKey: enquiryClosureQueryKey(enquiryId),
    queryFn: () => getEnquiryClosureState(enquiryId),
    refetchInterval: 15000
  });
}
