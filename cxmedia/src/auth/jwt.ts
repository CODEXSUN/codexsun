import { createHmac, timingSafeEqual } from "node:crypto"

function encodeBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url")
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

export function signJwt(
  payload: Record<string, string | number | boolean>,
  options: {
    secret: string
    subject: string
    expiresInSeconds: number
  }
) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    sub: options.subject,
    iat: issuedAt,
    exp: issuedAt + options.expiresInSeconds,
  }
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const encodedPayload = encodeBase64Url(JSON.stringify(body))
  const signature = signValue(`${encodedHeader}.${encodedPayload}`, options.secret)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyJwt<TPayload extends Record<string, unknown>>(
  token: string,
  secret: string
) {
  const [encodedHeader, encodedPayload, signature] = token.split(".")

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid token.")
  }

  const expectedSignature = signValue(`${encodedHeader}.${encodedPayload}`, secret)

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid token signature.")
  }

  const header = JSON.parse(decodeBase64Url(encodedHeader)) as {
    alg?: string
    typ?: string
  }
  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as TPayload & {
    exp?: number
    sub?: string
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Unsupported token format.")
  }

  if (!payload.sub || typeof payload.exp !== "number") {
    throw new Error("Invalid token payload.")
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired.")
  }

  return payload
}

export function signOpaquePayload(
  payload: Record<string, string | number | boolean>,
  secret: string
) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signValue(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export function verifyOpaquePayload<TPayload extends Record<string, unknown>>(
  token: string,
  secret: string
) {
  const [encodedPayload, signature] = token.split(".")

  if (!encodedPayload || !signature) {
    throw new Error("Invalid signed payload.")
  }

  const expectedSignature = signValue(encodedPayload, secret)

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid signed payload signature.")
  }

  return JSON.parse(decodeBase64Url(encodedPayload)) as TPayload
}
