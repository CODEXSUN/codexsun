import { createHash, createHmac } from "node:crypto"

import type { CxmediaConfig } from "../config/env.js"

type S3ObjectMetadata = {
  byteSize: number | null
  contentType: string
  createdAt: string | null
  etag: string | null
  metadata: Record<string, string>
  path: string
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex")
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest()
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (match) =>
    `%${match.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

function xmlDecode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
}

function parseTag(source: string, tagName: string) {
  const match = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`).exec(source)
  return match?.[1] ? xmlDecode(match[1]) : null
}

function parseListResponse(xml: string) {
  const items: Array<Omit<S3ObjectMetadata, "contentType" | "metadata">> = []
  const matches = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)

  for (const match of matches) {
    const block = match[1]

    if (!block) {
      continue
    }

    const path = parseTag(block, "Key") ?? ""

    if (!path) {
      continue
    }

    items.push({
      byteSize: Number(parseTag(block, "Size") ?? "0") || null,
      createdAt: parseTag(block, "LastModified"),
      etag: parseTag(block, "ETag")?.replace(/"/g, "") ?? null,
      path,
    })
  }

  return items
}

export class S3Client {
  constructor(private readonly config: CxmediaConfig["storage"]) {}

  async ensureBucket() {
    try {
      await this.issueRequest({
        method: "HEAD",
        path: "",
        expectedStatusCodes: [200],
      })
    } catch {
      await this.issueRequest({
        method: "PUT",
        path: "",
        expectedStatusCodes: [200],
      })
    }
  }

  async putObject(
    objectPath: string,
    content: Buffer,
    options: {
      contentType: string
      metadata?: Record<string, string>
    }
  ) {
    await this.issueRequest({
      method: "PUT",
      path: objectPath,
      body: content,
      contentType: options.contentType,
      headers: Object.fromEntries(
        Object.entries(options.metadata ?? {}).map(([key, value]) => [
          `x-amz-meta-${key}`,
          value,
        ])
      ),
      expectedStatusCodes: [200],
    })
  }

  async deleteObject(objectPath: string) {
    await this.issueRequest({
      method: "DELETE",
      path: objectPath,
      expectedStatusCodes: [204],
    })
  }

  async getObject(objectPath: string) {
    const response = await this.issueRequest({
      method: "GET",
      path: objectPath,
      expectedStatusCodes: [200],
    })
    const metadata = this.readMetadataHeaders(response.headers)

    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentLength: Number(response.headers.get("content-length") ?? "0") || null,
      contentType: response.headers.get("content-type") || "application/octet-stream",
      etag: response.headers.get("etag")?.replace(/"/g, "") ?? null,
      lastModified: response.headers.get("last-modified"),
      metadata,
    }
  }

  async headObject(objectPath: string): Promise<S3ObjectMetadata> {
    const response = await this.issueRequest({
      method: "HEAD",
      path: objectPath,
      expectedStatusCodes: [200],
    })

    return {
      byteSize: Number(response.headers.get("content-length") ?? "0") || null,
      contentType: response.headers.get("content-type") || "application/octet-stream",
      createdAt: response.headers.get("last-modified"),
      etag: response.headers.get("etag")?.replace(/"/g, "") ?? null,
      metadata: this.readMetadataHeaders(response.headers),
      path: objectPath,
    }
  }

  async listObjects(prefix: string) {
    const response = await this.issueRequest({
      method: "GET",
      path: "",
      query: {
        "list-type": "2",
        "max-keys": "500",
        ...(prefix ? { prefix } : {}),
      },
      expectedStatusCodes: [200],
    })
    const xml = await response.text()
    const items = parseListResponse(xml)

    return Promise.all(
      items.map(async (item) => {
        try {
          return await this.headObject(item.path)
        } catch {
          return {
            byteSize: item.byteSize,
            contentType: "application/octet-stream",
            createdAt: item.createdAt,
            etag: item.etag,
            metadata: {},
            path: item.path,
          }
        }
      })
    )
  }

  private readMetadataHeaders(headers: Headers) {
    const metadata: Record<string, string> = {}

    headers.forEach((value, key) => {
      if (key.startsWith("x-amz-meta-")) {
        metadata[key.replace(/^x-amz-meta-/, "")] = value
      }
    })

    return metadata
  }

  private async issueRequest(options: {
    method: "GET" | "HEAD" | "PUT" | "DELETE"
    path: string
    query?: Record<string, string>
    body?: Buffer
    contentType?: string
    headers?: Record<string, string>
    expectedStatusCodes: number[]
  }) {
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)
    const endpointUrl = new URL(this.config.endpoint)
    const bucketBasePath = this.config.pathStyle ? `/${this.config.bucket}` : ""
    const objectPath = options.path
      ? `/${options.path.split("/").map(encodeRfc3986).join("/")}`
      : ""
    const requestUrl = new URL(
      this.config.pathStyle
        ? `${endpointUrl.origin}${bucketBasePath}${objectPath || ""}`
        : `${endpointUrl.protocol}//${this.config.bucket}.${endpointUrl.host}${objectPath || "/"}`
    )

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        requestUrl.searchParams.set(key, value)
      }
    }

    const body = options.body ?? Buffer.alloc(0)
    const payloadHash = sha256Hex(body)
    const queryEntries = [...requestUrl.searchParams.entries()].sort(([left], [right]) =>
      left.localeCompare(right)
    )
    const canonicalQuery = queryEntries
      .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
      .join("&")
    const headers = {
      host: requestUrl.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...(options.contentType ? { "content-type": options.contentType } : {}),
      ...(options.headers ?? {}),
    }
    const canonicalHeaders = Object.entries(headers)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${value.trim()}\n`)
      .join("")
    const signedHeaders = Object.keys(headers).sort().join(";")
    const canonicalRequest = [
      options.method,
      requestUrl.pathname,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n")
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n")
    const signingKey = hmac(
      hmac(
        hmac(hmac(`AWS4${this.config.secretAccessKey}`, dateStamp), this.config.region),
        "s3"
      ),
      "aws4_request"
    )
    const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex")
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const response = await fetch(requestUrl, {
      method: options.method,
      headers: {
        ...headers,
        authorization,
      },
      body:
        options.method === "GET" || options.method === "HEAD"
          ? undefined
          : new Uint8Array(body),
    })

    if (!options.expectedStatusCodes.includes(response.status)) {
      const errorText = await response.text().catch(() => "")
      throw new Error(
        `S3 request failed (${options.method} ${requestUrl.pathname}) with status ${response.status}.${errorText ? ` ${errorText}` : ""}`
      )
    }

    return response
  }
}
