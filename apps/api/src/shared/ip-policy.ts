import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { HttpRouteHandlerContext } from "../../../framework/src/runtime/http/route-types.js"

import { getRequestMeta } from "./request.js"

function normalizeIpv4(ipAddress: string) {
  const trimmed = ipAddress.trim()
  const withoutMappedPrefix = trimmed.replace(/^::ffff:/i, "")
  return withoutMappedPrefix
}

function ipv4ToNumber(ipAddress: string) {
  const normalized = normalizeIpv4(ipAddress)
  const octets = normalized.split(".").map((entry) => Number(entry))

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return null
  }

  return (
    octets[0]! * 256 ** 3 +
    octets[1]! * 256 ** 2 +
    octets[2]! * 256 +
    octets[3]!
  )
}

function matchesExactOrCidr(ipAddress: string, allowedEntry: string) {
  const candidate = allowedEntry.trim()

  if (!candidate) {
    return false
  }

  if (!candidate.includes("/")) {
    return normalizeIpv4(ipAddress) === normalizeIpv4(candidate)
  }

  const [networkAddress, prefixLengthRaw] = candidate.split("/")
  const prefixLength = Number(prefixLengthRaw)
  const ipValue = ipv4ToNumber(ipAddress)
  const networkValue = ipv4ToNumber(networkAddress ?? "")

  if (
    ipValue === null ||
    networkValue === null ||
    !Number.isInteger(prefixLength) ||
    prefixLength < 0 ||
    prefixLength > 32
  ) {
    return false
  }

  const mask =
    prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0

  return (ipValue & mask) === (networkValue & mask)
}

function assertAllowedIp(
  ipAddress: string | null,
  allowedIps: readonly string[],
  label: string
) {
  if (allowedIps.length === 0) {
    return
  }

  if (!ipAddress) {
    throw new ApplicationError(`${label} requires a resolvable client IP address.`, {}, 403)
  }

  if (!allowedIps.some((entry) => matchesExactOrCidr(ipAddress, entry))) {
    throw new ApplicationError(`${label} blocked this request IP address.`, { ipAddress }, 403)
  }
}

export function enforceInternalAccessPolicy(
  context: HttpRouteHandlerContext,
  config: ServerConfig
) {
  if (context.route.surface !== "internal") {
    return
  }

  const requestMeta = getRequestMeta(context.request)

  assertAllowedIp(
    requestMeta.ipAddress,
    config.security.internalApiAllowedIps,
    "Internal API access policy"
  )
}

export function enforceAdminAccessPolicy(
  context: HttpRouteHandlerContext,
  config: ServerConfig
) {
  const requestMeta = getRequestMeta(context.request)

  assertAllowedIp(
    requestMeta.ipAddress,
    config.security.adminAllowedIps,
    "Admin access policy"
  )
}
