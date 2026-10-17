import { useCallback, useEffect, useState } from "react";

import type { EnquiryGateway, EnquiryQuery, EnquiryRecord } from "./enquiry.types.js";

export function useEnquiries(
  uuid: string,
  gateway: EnquiryGateway | undefined,
  query: EnquiryQuery
) {
  const [data, setData] = useState<{ records: EnquiryRecord[]; total: number }>({
    records: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setData({ records: [], total: 0 });
    const timer = setTimeout(() => {
      if (!gateway) {
        setError("The enquiry service is unavailable.");
        setLoading(false);
        return;
      }
      void gateway
        .list(uuid, query)
        .then((result) => {
          if (active) setData(result);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : "Could not load enquiries.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [uuid, gateway, query.q, query.status, query.trash, query.page, version]);

  return { ...data, loading, error, refresh };
}
