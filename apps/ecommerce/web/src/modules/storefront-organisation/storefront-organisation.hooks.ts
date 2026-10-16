import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateStorefrontClientCache } from "../storefront";
import {
  getStorefrontOrganisation,
  getStorefrontOrganisationOptions,
  saveStorefrontOrganisation,
  uploadStorefrontOrganisationLogo
} from "./storefront-organisation.services";

export function useStorefrontOrganisation() {
  const client = useQueryClient();
  const key = ["ecommerce", "storefront-organisation"];
  const settings = useQuery({ queryKey: key, queryFn: getStorefrontOrganisation });
  const options = useQuery({
    queryKey: [...key, "options"],
    queryFn: getStorefrontOrganisationOptions
  });
  const save = useMutation({
    mutationFn: saveStorefrontOrganisation,
    onSuccess: (value) => {
      client.setQueryData(key, value);
      invalidateStorefrontClientCache();
    }
  });
  const upload = useMutation({ mutationFn: uploadStorefrontOrganisationLogo });
  return { settings, options, save, upload };
}
