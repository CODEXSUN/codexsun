import type { MarketingTransport } from "../../transport";
import type { SubmissionInput, SubmissionRecord } from "./submission.types";
export const listSubmissions = (
  api: MarketingTransport,
  page: number,
  search = "",
  status = "all"
) =>
  api.get<SubmissionRecord[]>(
    "/marketing/submissions?limit=50&offset=" +
      page * 50 +
      "&search=" +
      encodeURIComponent(search) +
      "&status=" +
      status
  );
export const saveSubmission = (api: MarketingTransport, input: SubmissionInput) =>
  api.post<SubmissionRecord>("/marketing/submissions", input);
export const retrySubmission = (api: MarketingTransport, uuid: string) =>
  api.post<SubmissionRecord>("/marketing/submissions/" + uuid + "/retry", {});
export const captureOptions = (api: MarketingTransport) =>
  api.get<
    { uuid: string; name: string; consentNotice: string; noticeVersion: string; status: string }[]
  >("/marketing/captures?limit=100");

export const getSubmission = (api: MarketingTransport, uuid: string) =>
  api.get<SubmissionRecord>("/marketing/submissions/" + uuid);
export const countSubmissions = (api: MarketingTransport, search: string, status: string) =>
  api.get<{ total: number }>(
    "/marketing/submissions/count?search=" + encodeURIComponent(search) + "&status=" + status
  );
