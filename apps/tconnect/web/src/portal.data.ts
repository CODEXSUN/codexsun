import { useCallback, useEffect, useState } from "react";
import { getCompany } from "./modules/company/company.services";
import { getAssociation } from "./modules/association/association.services";
import { getCommunity } from "./modules/community/community.services";
import { registrationContext } from "./modules/member/member.services";
import { searchPublicProducts } from "./modules/product/product.services";
import { publicCredentials } from "./modules/credential/credential.services";
export function usePortalData() {
  const companies = usePublicFeed(getCompany, []);
  const associations = usePublicFeed(getAssociation, []);
  const posts = usePublicFeed(getCommunity, []);
  const registration = usePublicFeed(registrationContext, {
    corporateId: ""
  } as Awaited<ReturnType<typeof registrationContext>>);
  const products = usePublicFeed(searchPublicProducts, []);
  const credentials = usePublicFeed(publicCredentials, []);
  return {
    companies,
    associations,
    posts,
    products,
    credentials,
    corporateId: registration.data.corporateId,
    registration
  };
}
export type PortalData = ReturnType<typeof usePortalData>;
export function usePublicFeed<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError("This section is temporarily unavailable. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader, version]);
  return { data, loading, error, reload };
}
