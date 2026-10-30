import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStorefrontProfile, saveStorefrontProfile } from "./storefront-profile.services";
import { invalidateStorefrontClientCache } from "../storefront";

export const storefrontProfileQueryKey = ["ecommerce", "storefront-profile"] as const;

export function useStorefrontProfile() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryFn: getStorefrontProfile, queryKey: storefrontProfileQueryKey });
  const save = useMutation({
    mutationFn: saveStorefrontProfile,
    onSuccess: (value) => {
      invalidateStorefrontClientCache();
      queryClient.setQueryData(storefrontProfileQueryKey, value);
    }
  });
  return { profile, save };
}
