import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto"

const passwordAlgorithm = "scrypt"
const passwordKeyLength = 64
const passwordWorkFactor = 16_384
const passwordBlockSize = 8
const passwordParallelization = 1

function splitPasswordHash(hash: string) {
  const [algorithm, workFactor, blockSize, parallelization, salt, digest] =
    hash.split("$")

  if (
    algorithm !== passwordAlgorithm ||
    !workFactor ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !digest
  ) {
    throw new Error("Unsupported password hash format.")
  }

  return {
    workFactor: Number(workFactor),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    salt,
    digest,
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url")
  const derivedKey = await deriveKey(password, salt, {
    N: passwordWorkFactor,
    r: passwordBlockSize,
    p: passwordParallelization,
  })

  return [
    passwordAlgorithm,
    String(passwordWorkFactor),
    String(passwordBlockSize),
    String(passwordParallelization),
    salt,
    derivedKey.toString("base64url"),
  ].join("$")
}

export async function verifyPassword(password: string, passwordHash: string) {
  const parsed = splitPasswordHash(passwordHash)
  const derivedKey = await deriveKey(password, parsed.salt, {
    N: parsed.workFactor,
    r: parsed.blockSize,
    p: parsed.parallelization,
  })
  const storedDigest = Buffer.from(parsed.digest, "base64url")

  return (
    storedDigest.length === derivedKey.length &&
    timingSafeEqual(storedDigest, derivedKey)
  )
}

function deriveKey(
  password: string,
  salt: string,
  options: {
    N: number
    r: number
    p: number
  }
) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      passwordKeyLength,
      options,
      (error, derivedKey) => {
        if (error) {
          reject(error)
          return
        }

        resolve(derivedKey as Buffer)
      }
    )
  })
}
