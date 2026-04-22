import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const DEFAULT_ITERATIONS = 120_000

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyPassword(
  password: string,
  options: {
    plainTextPassword: string | null
    passwordHash: string | null
  }
) {
  if (options.passwordHash) {
    const [scheme, ...parts] = options.passwordHash.split("$")

    if (scheme === "pbkdf2") {
      const [iterationsText, salt, expectedHash] = parts

      if (!iterationsText || !salt || !expectedHash) {
        throw new Error("Invalid CXMEDIA_ADMIN_PASSWORD_HASH format.")
      }

      const derived = pbkdf2Sync(
        password,
        salt,
        Number(iterationsText),
        32,
        "sha256"
      ).toString("hex")

      return safeCompare(derived, expectedHash)
    }

    if (scheme === "scrypt") {
      const [workFactorText, blockSizeText, parallelizationText, salt, expectedHash] = parts

      if (!workFactorText || !blockSizeText || !parallelizationText || !salt || !expectedHash) {
        throw new Error("Invalid CXMEDIA_ADMIN_PASSWORD_HASH format.")
      }

      const derived = scryptSync(password, salt, 64, {
        N: Number(workFactorText),
        r: Number(blockSizeText),
        p: Number(parallelizationText),
      }).toString("base64url")

      return safeCompare(derived, expectedHash)
    }

    throw new Error("Invalid CXMEDIA_ADMIN_PASSWORD_HASH format.")
  }

  if (!options.plainTextPassword) {
    return false
  }

  return safeCompare(password, options.plainTextPassword)
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, 32, "sha256").toString("hex")

  return `pbkdf2$${DEFAULT_ITERATIONS}$${salt}$${hash}`
}
