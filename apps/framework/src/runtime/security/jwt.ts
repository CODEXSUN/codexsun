import { createHmac } from "node:crypto"

import { ApplicationError } from "../errors/application-error.js"

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type JwtPayloadBase = Record<string, JsonValue>

function encodeBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url")
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function signSegment(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url")
}

export function signJwt<TPayload extends JwtPayloadBase>(
  payload: TPayload,
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
  const encodedHeader = encodeBase64Url(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  )
  const encodedPayload = encodeBase64Url(JSON.stringify(body))
  const signature = signSegment(
    `${encodedHeader}.${encodedPayload}`,
    options.secret
  )

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyJwt<TPayload extends JwtPayloadBase>(
  token: string,
  options: {
    secret: string
  }
) {
  const [encodedHeader, encodedPayload, signature] = token.split(".")

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new ApplicationError("Invalid access token.", {}, 401)
  }

  const expectedSignature = signSegment(
    `${encodedHeader}.${encodedPayload}`,
    options.secret
  )

  if (signature !== expectedSignature) {
    throw new ApplicationError("Invalid access token signature.", {}, 401)
  }

  let header: { alg?: string; typ?: string }
  let payload: TPayload & { sub?: string; exp?: number }

  try {
    header = JSON.parse(decodeBase64Url(encodedHeader)) as {
      alg?: string
      typ?: string
    }
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as TPayload & {
      sub?: string
      exp?: number
    }
  } catch {
    throw new ApplicationError("Invalid access token payload.", {}, 401)
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new ApplicationError("Unsupported access token format.", {}, 401)
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new ApplicationError("Invalid access token subject.", {}, 401)
  }

  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new ApplicationError("Access token expired.", {}, 401)
  }

  return payload
}
