import { useCallback, useEffect, useState } from "react";
import { getCompany } from "@codexsun/tconnect-web/public";
import { getAssociation } from "@codexsun/tconnect-web/public";
import { getCommunity } from "@codexsun/tconnect-web/public";
import { registrationContext } from "@codexsun/tconnect-web/public";
import { searchPublicProducts } from "@codexsun/tconnect-web/public";
import { publicCredentials } from "@codexsun/tconnect-web/public";
export function usePortalData() {
  const registration = usePublicFeed(registrationContext, { corporateId: "" } as Awaited<
    ReturnType<typeof registrationContext>
  >);
  const ready =
    !registration.loading &&
    !registration.error &&
    registration.data.corporateId === "TIRUPURCONNECT";
  const companies = usePublicFeed(getCompany, [], ready);
  const associations = usePublicFeed(getAssociation, [], ready);
  const posts = usePublicFeed(getCommunity, [], ready);
  const products = usePublicFeed(searchPublicProducts, [], ready);
  const credentials = usePublicFeed(publicCredentials, [], ready);
  useEffect(() => {
    const refresh = () => credentials.reload();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [credentials.reload]);
  return {
    companies,
    associations,
    posts,
    products,
    credentials: {
      ...credentials,
      data: credentials.error
        ? []
        : credentials.data.filter(
            (record) => record.expiresOn >= new Date().toISOString().slice(0, 10)
          )
    },
    corporateId: registration.data.corporateId,
    registration
  };
}
export type PortalData = ReturnType<typeof usePortalData>;
export function usePublicFeed<T>(loader: () => Promise<T>, initial: T, enabled = true) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) {
      setData(initial);
      setLoading(false);
      setError("");
      return;
    }
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
  }, [loader, version, enabled]);
  return { data, loading, error, reload };
}
