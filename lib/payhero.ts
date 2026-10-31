// lib/payhero.ts

export type PayHeroInitiatePaymentInput = {
  amount: number;
  phoneNumber: string;
  channelId: string;
  externalReference: string;
  callbackUrl: string;
};

export type NormalizedPaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "reversed";

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke/api/v2";

type PayHeroRequestPayload = {
  amount: number;
  phone_number: string;
  channel_id: number;
  provider: "m-pesa";
  external_reference: string;
  callback_url: string;
};

type ParsedPayHeroBody = Record<string, unknown> | string | null;

const REVERSAL_STATUS_PATTERN = /revers|refund|chargeback|dispute/;
const FAILED_STATUS_PATTERN = /failed|invalid|unable to process|insufficient/;

export class PayHeroRequestError extends Error {
  status: number;
  responseBody: string;
  endpointUrl: string;
  payload: string | null;

  constructor(message: string, status: number, responseBody: ParsedPayHeroBody, endpointUrl: string, payload: PayHeroRequestPayload | null) {
    super(message);
    this.name = "PayHeroRequestError";
    this.status = status;
    this.responseBody = stringifyPayHeroLogValue(responseBody);
    this.endpointUrl = endpointUrl;
    this.payload = payload ? stringifyPayHeroLogValue(payload) : null;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      endpointUrl: this.endpointUrl,
      responseBody: this.responseBody,
      payload: this.payload,
    };
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toJSON();
  }
}

function getPayHeroAuthHeader() {
  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;

  if (!username) throw new Error("Missing PAYHERO_API_USERNAME.");
  if (!password) throw new Error("Missing PAYHERO_API_PASSWORD.");

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function validateChannelId(channelId?: string | null) {
  if (!channelId) throw new Error("Missing PAYHERO_CHANNEL_ID.");
  if (!/^\d+$/.test(channelId)) throw new Error("PAYHERO_CHANNEL_ID must be numeric.");
  return Number(channelId);
}

function validateAmount(amount: number) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("PayHero amount must be a positive number.");
  }
  return parsedAmount;
}

function validatePhoneNumber(phoneNumber: string) {
  if (!/^254[71]\d{8}$/.test(phoneNumber)) {
    throw new Error("PayHero phone number must be in 2547XXXXXXXX or 2541XXXXXXXX format.");
  }
  return phoneNumber;
}

function validateCallbackUrl(callbackUrl: string) {
  try {
    const url = new URL(callbackUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Invalid callback URL protocol.");
    }
    return url.toString();
  } catch {
    throw new Error("PayHero callback_url must be a valid URL.");
  }
}

function stringifyPayHeroLogValue(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

async function readPayHeroResponseBody(response: Response): Promise<ParsedPayHeroBody> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return text;
  }
}

function getPayHeroErrorMessage(status: number, body: ParsedPayHeroBody) {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const message = body.message || body.error || body.detail;
    if (typeof message === "string" && message.trim()) return message;
  }

  return `PayHero request failed with status ${status}`;
}

async function parsePayHeroResponse(response: Response, endpointUrl: string, payload: PayHeroRequestPayload | null = null): Promise<Record<string, unknown>> {
  const data = await readPayHeroResponseBody(response);

  if (!response.ok) {
    console.error("PayHero API error", {
      status: response.status,
      endpointUrl,
      responseBody: JSON.stringify(data, null, 2),
      payload: payload
        ? JSON.stringify({ ...payload, phone_number: "[redacted]" }, null, 2)
        : null,
    });

    throw new PayHeroRequestError(getPayHeroErrorMessage(response.status, data), response.status, data, endpointUrl, payload);
  }

  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

export async function initiatePayHeroPayment(input: PayHeroInitiatePaymentInput) {
  const endpointUrl = `${PAYHERO_BASE_URL}/payments`;
  const payload: PayHeroRequestPayload = {
    amount: validateAmount(input.amount),
    phone_number: validatePhoneNumber(input.phoneNumber),
    channel_id: validateChannelId(input.channelId),
    provider: "m-pesa",
    external_reference: input.externalReference,
    callback_url: validateCallbackUrl(input.callbackUrl),
  };

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      Authorization: getPayHeroAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parsePayHeroResponse(response, endpointUrl, payload);
}

export async function getPayHeroTransactionStatus(checkoutRequestId: string) {
  const url = new URL(`${PAYHERO_BASE_URL}/transaction-status`);
  url.searchParams.set("reference", checkoutRequestId);

  const response = await fetch(url, {
    headers: {
      Authorization: getPayHeroAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  return parsePayHeroResponse(response, url.toString());
}

export function normalizePayHeroStatus(status?: string | null, resultCode?: string | number | null): NormalizedPaymentStatus {
  const normalized = String(status || "").trim().toUpperCase();
  const code = resultCode === null || resultCode === undefined ? undefined : Number(resultCode);

  if (normalized === "SUCCESS" || normalized === "SUCCESSFUL" || normalized === "PAID" || code === 0) return "paid";
  if (normalized === "QUEUED" || normalized === "PENDING" || normalized === "PROCESSING") return "pending";
  if (normalized === "CANCELLED" || normalized === "CANCELED") return "cancelled";
  if (normalized === "REVERSED" || normalized === "REFUNDED" || normalized === "CHARGEBACK") return "reversed";
  if (normalized === "FAILED" || (code !== undefined && code !== 0)) return "failed";

  return "pending";
}

function getStatusValue(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null) return String(value).trim();
  }
  return "";
}

export function normalizePayHeroProviderStatus(statusData: Record<string, unknown>): NormalizedPaymentStatus {
  const rawStatus = getStatusValue(statusData, ["Status", "status"]);
  const rawResultCode = statusData.ResultCode || statusData.result_code || statusData.resultCode;
  const description = getStatusValue(statusData, [
    "ResultDesc",
    "ResultDescription",
    "ResponseDescription",
    "description",
    "message",
  ]);
  const combinedText = `${rawStatus} ${description}`.toLowerCase();

  if (REVERSAL_STATUS_PATTERN.test(combinedText)) return "reversed";
  if (FAILED_STATUS_PATTERN.test(combinedText)) return "failed";

  return normalizePayHeroStatus(
    rawStatus || null,
    typeof rawResultCode === "string" || typeof rawResultCode === "number" ? rawResultCode : null
  );
}

export function getPayHeroReference(payload: Record<string, unknown>) {
  return String(
    payload.CheckoutRequestID ||
      payload.CheckoutRequestId ||
      payload.checkout_request_id ||
      payload.checkoutRequestId ||
      payload.reference ||
      payload.Reference ||
      ""
  );
}

export function getPayHeroExternalReference(payload: Record<string, unknown>) {
  return String(
    payload.ExternalReference ||
      payload.external_reference ||
      payload.externalReference ||
      payload.MerchantRequestID ||
      payload.merchant_request_id ||
      ""
  );
}
