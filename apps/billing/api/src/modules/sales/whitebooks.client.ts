import { AppError } from "@codexsun/framework/errors";
import { env } from "../../env.js";
import { buildEinvoicePayload, buildEwayPayload } from "./sales.whitebooks-payload.js";
import type { ComplianceParties } from "./sales.compliance-parties.js";
import type { Sale, SaleEinvoiceDetails, SaleEwayDetails } from "./sales.types.js";

type ComplianceResult = {
  einvoice?: Partial<SaleEinvoiceDetails>;
  eway?: Partial<SaleEwayDetails>;
  response: unknown;
};

export async function generateSaleEinvoice(
  invoice: Sale,
  parties: ComplianceParties
): Promise<ComplianceResult> {
  assertSeller(parties);
  const payload = buildEinvoicePayload(invoice, parties);
  const response = await callWhiteBooks(
    "/einvoice/type/GENERATE/version/V1_03",
    "POST",
    payload,
    await authToken(false)
  );
  const data = responseData(response);
  const irn = text(data.Irn ?? data.IRN ?? data.irn);
  const ackNo = text(data.AckNo ?? data.ackNo);
  const signedQr = text(data.SignedQRCode ?? data.signedQr);
  if (!/^[a-f0-9]{64}$/i.test(irn) || !ackNo || !signedQr)
    throw AppError.validation(
      "WhiteBooks returned incomplete e-invoice details. Check the provider document status before retrying."
    );
  return {
    einvoice: {
      irn,
      ackNo,
      signedQr,
      ackDate: storageDate(data.AckDt ?? data.ackDt, true),
      status: "generated"
    },
    response
  };
}

export async function generateSaleEway(
  invoice: Sale,
  parties: ComplianceParties,
  distanceKm = 0
): Promise<ComplianceResult> {
  assertSeller(parties);
  const payload = buildEwayPayload(invoice, parties, distanceKm);
  const standalone = !invoice.einvoice.irn;
  const response = await callWhiteBooks(
    standalone
      ? "/ewaybillapi/v1.03/ewayapi/genewaybill"
      : "/einvoice/type/GENERATE_EWAYBILL/version/V1_03",
    "POST",
    payload,
    await authToken(standalone)
  );
  const data = responseData(response);
  const billNo = text(data.EwbNo ?? data.ewayBillNo);
  if (!/^\d{12}$/.test(billNo))
    throw AppError.validation(
      "WhiteBooks returned no valid E-way bill number. Check the provider document status before retrying."
    );
  return {
    eway: {
      billNo,
      billDate: storageDate(data.EwbDt ?? data.ewayBillDate, false),
      status: "generated"
    },
    response
  };
}

export async function verifyWhiteBooksSandbox() {
  if (env.GSP_ENVIRONMENT !== "sandbox")
    throw AppError.validation("Sandbox verification requires GSP_ENVIRONMENT=sandbox.");
  await authToken(false);
  await authToken(true);
  return { environment: "sandbox", einvoiceAuthenticated: true, ewayAuthenticationAccepted: true };
}

export async function authToken(standalone: boolean) {
  const response = await callWhiteBooks(
    standalone ? "/ewaybillapi/v1.03/authenticate" : "/einvoice/authenticate",
    "GET"
  );
  if (
    standalone &&
    !responseData(response).AuthToken &&
    !responseData(response).authToken &&
    !responseData(response).authtoken &&
    String(object(response).status_cd) === "1"
  )
    return undefined;
  const data = responseData(response);
  const token = text(data.AuthToken ?? data.authToken ?? data.authtoken ?? data["auth-token"]);
  if (!token)
    throw AppError.validation(
      `WhiteBooks ${standalone ? "E-way" : "e-invoice"} authentication returned no token. Verify the product client keys and taxpayer credentials.`
    );
  return token;
}

export async function callWhiteBooks(
  endpoint: string,
  method: "GET" | "POST",
  payload?: unknown,
  token?: string,
  query: Record<string, string> = {},
  extraHeaders: Record<string, string> = {}
) {
  const config = providerConfig(endpoint.startsWith("/ewaybillapi/"));
  const url = new URL(endpoint, config.baseUrl);
  url.searchParams.set("email", config.email);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const ewayAuth = endpoint === "/ewaybillapi/v1.03/authenticate";
  if (ewayAuth) {
    url.searchParams.set("username", config.username);
    url.searchParams.set("password", config.password);
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(30000),
      ...(method === "POST" ? { body: JSON.stringify(payload) } : {}),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        ...extraHeaders,
        gstin: config.gstin,
        ip_address: config.ipAddress,
        ...(!ewayAuth ? { username: config.username } : {}),
        ...(token
          ? { "auth-token": token }
          : endpoint === "/einvoice/authenticate"
            ? { password: config.password }
            : {})
      }
    });
  } catch {
    throw AppError.validation(
      "WhiteBooks could not be reached. Check provider document status before retrying generation."
    );
  }
  if (!response.ok)
    throw AppError.validation(
      `WhiteBooks request failed (HTTP ${response.status}). Check provider document status before retrying generation.`
    );
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw AppError.validation(
      "WhiteBooks returned an invalid JSON response. Check provider document status before retrying."
    );
  }
  assertProviderSuccess(parsed);
  return parsed;
}

export function assertSeller(parties: ComplianceParties) {
  const config = providerConfig();
  if (parties.seller.gstin?.trim().toUpperCase() !== config.gstin)
    throw AppError.validation(
      "The invoice company GSTIN does not match the configured WhiteBooks GSTIN."
    );
}

function providerConfig(standalone = false) {
  const production = env.GSP_ENVIRONMENT === "production";
  const clientId = production
    ? (standalone
        ? env.CODEXSUN_WHITEBOOKS_PRODUCTION_EWAY_CLIENT_ID
        : env.CODEXSUN_WHITEBOOKS_PRODUCTION_EINVOICE_CLIENT_ID) || env.GSP_CLIENT_ID
    : standalone
      ? env.CODEXSUN_WHITEBOOKS_EWAY_CLIENT_ID || env.GSP_CLIENT_ID
      : env.GSP_CLIENT_ID;
  const clientSecret = production
    ? (standalone
        ? env.CODEXSUN_WHITEBOOKS_PRODUCTION_EWAY_CLIENT_SECRET
        : env.CODEXSUN_WHITEBOOKS_PRODUCTION_EINVOICE_CLIENT_SECRET) || env.GSP_CLIENT_SECRET
    : standalone
      ? env.CODEXSUN_WHITEBOOKS_EWAY_CLIENT_SECRET || env.GSP_CLIENT_SECRET
      : env.GSP_CLIENT_SECRET;
  if (production && env.GSP_GSTIN === "29AAGCB1286Q000")
    throw AppError.validation(
      "Replace the sandbox taxpayer GSTIN and login with the real company production credentials before going live."
    );
  if (
    standalone &&
    Boolean(env.CODEXSUN_WHITEBOOKS_EWAY_CLIENT_ID) !==
      Boolean(env.CODEXSUN_WHITEBOOKS_EWAY_CLIENT_SECRET)
  )
    throw AppError.validation("Configure both WhiteBooks E-way product keys.");
  const missing = [
    ["GSP_EMAIL", env.GSP_EMAIL],
    ["GSP_USERNAME", env.GSP_USERNAME],
    ["GSP_PASSWORD", env.GSP_PASSWORD],
    ["WhiteBooks client ID", clientId],
    ["WhiteBooks client secret", clientSecret],
    ["GSP_GSTIN", env.GSP_GSTIN],
    ["GSP_IP_ADDRESS", env.GSP_IP_ADDRESS]
  ]
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);
  if (missing.length)
    throw AppError.validation(`WhiteBooks configuration is missing: ${missing.join(", ")}.`);
  const baseUrl =
    env.GSP_ENVIRONMENT === "production" ? env.GSP_BASE_URL : env.GSP_SANDBOX_BASE_URL;
  const url = new URL(baseUrl);
  const host =
    env.GSP_ENVIRONMENT === "production" ? "api.whitebooks.in" : "apisandbox.whitebooks.in";
  if (
    url.protocol !== "https:" ||
    url.hostname !== host ||
    url.username ||
    url.password ||
    url.port
  )
    throw AppError.validation(
      "WhiteBooks base URL must match the selected official HTTPS environment."
    );
  return {
    baseUrl,
    email: env.GSP_EMAIL,
    username: env.GSP_USERNAME,
    password: env.GSP_PASSWORD,
    clientId,
    clientSecret,
    gstin: env.GSP_GSTIN.trim().toUpperCase(),
    ipAddress: env.GSP_IP_ADDRESS
  };
}

export function responseData(value: unknown): Record<string, unknown> {
  const record = object(value);
  const data = typeof record.data === "string" ? parseData(record.data) : record.data;
  return data === undefined ? record : object(data);
}

export function assertProviderSuccess(value: unknown) {
  const envelope = object(value);
  const data = responseData(value);
  for (const record of [envelope, data]) {
    const status = record.status_cd ?? record.status ?? record.Status;
    if (
      status !== undefined &&
      !["1", "success", "succeeded", "sucess", "true", "act", "cnl", "cancelled"].includes(
        String(status).toLowerCase()
      )
    ) {
      const errors =
        record.ErrorDetails ??
        record.error ??
        record.status_desc ??
        record.message ??
        envelope.status_desc;
      throw AppError.validation(`WhiteBooks rejected the request: ${safeError(errors)}.`);
    }
    if (
      (Array.isArray(record.ErrorDetails)
        ? record.ErrorDetails.length > 0
        : Boolean(record.ErrorDetails)) ||
      record.error
    )
      throw AppError.validation(
        `WhiteBooks rejected the request: ${safeError(record.ErrorDetails ?? record.error)}.`
      );
  }
}

export function storageDate(value: unknown, withTime: boolean) {
  const date = text(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/.exec(date);
  const local = /^(\d{2})[/-](\d{2})[/-](\d{4})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/.exec(date);
  const match = iso ?? local;
  if (!match)
    throw AppError.validation(
      "WhiteBooks returned an invalid document date. Check provider status before retrying."
    );
  const y = iso ? match[1] : match[3],
    m = match[2],
    d = iso ? match[3] : match[1];
  const day = new Date(`${y}-${m}-${d}T00:00:00Z`);
  if (Number.isNaN(day.valueOf()) || day.toISOString().slice(0, 10) !== `${y}-${m}-${d}`)
    throw AppError.validation("WhiteBooks returned an invalid calendar date.");
  let hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0),
    second = Number(match[6] ?? 0);
  const meridiem = /\b(AM|PM)\s*$/i.exec(date)?.[1]?.toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12)
      throw AppError.validation("WhiteBooks returned an invalid document time.");
    hour = (hour % 12) + (meridiem === "PM" ? 12 : 0);
  }
  if (hour > 23 || minute > 59 || second > 59)
    throw AppError.validation("WhiteBooks returned an invalid document time.");
  return `${y}-${m}-${d}${withTime ? `T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}` : ""}`;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw AppError.validation("WhiteBooks returned an invalid response object.");
  return value as Record<string, unknown>;
}
function parseData(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw AppError.validation("WhiteBooks returned invalid response data.");
  }
}
function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}
function safeError(value: unknown) {
  let message = typeof value === "string" ? value : JSON.stringify(value ?? "Request rejected");
  for (const secret of [
    env.GSP_PASSWORD,
    env.GSP_CLIENT_SECRET,
    env.CODEXSUN_WHITEBOOKS_EWAY_CLIENT_SECRET,
    env.CODEXSUN_WHITEBOOKS_PRODUCTION_EINVOICE_CLIENT_SECRET,
    env.CODEXSUN_WHITEBOOKS_PRODUCTION_EWAY_CLIENT_SECRET,
    env.GSP_CLIENT_ID,
    env.GSP_USERNAME,
    env.GSP_EMAIL
  ])
    if (secret) message = message.split(secret).join("[redacted]");
  return message.slice(0, 1000);
}
