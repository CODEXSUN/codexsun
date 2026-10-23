import type { MarketingTransport } from "../../transport";
import type { ConsentInput, ConsentRecord, EligibilityResult } from "./consent.types";
export const listConsents = (
  api: MarketingTransport,
  search: string,
  action: string,
  page: number
) =>
  api.get<ConsentRecord[]>(
    "/marketing/consents?search=" +
      encodeURIComponent(search) +
      "&action=" +
      action +
      "&limit=50&offset=" +
      page * 50
  );
export const countConsents = (api: MarketingTransport, search: string, action: string) =>
  api.get<{ total: number }>(
    "/marketing/consents/count?search=" + encodeURIComponent(search) + "&action=" + action
  );
export const getConsent = (api: MarketingTransport, uuid: string) =>
  api.get<ConsentRecord>("/marketing/consents/" + uuid);
export const appendConsent = (api: MarketingTransport, value: ConsentInput) =>
  api.post<ConsentRecord>("/marketing/consents", value);
export const checkConsentEligibility = (api: MarketingTransport, record: ConsentRecord) =>
  api.post<EligibilityResult>("/marketing/consents/eligibility", {
    brandUuid: record.brandUuid,
    recipient: record.recipient,
    channel: record.channel,
    purpose: record.purpose
  });
export const consentBrandOptions = (api: MarketingTransport) =>
  api.get<{ uuid: string; name: string; status: string }[]>(
    "/marketing/brands?limit=100&status=active"
  );
