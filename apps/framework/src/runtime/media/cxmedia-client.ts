import { ApplicationError } from "../errors/application-error.js"
import type { ServerConfig } from "../config/index.js"

type CxmediaSession = {
  accessToken: string
  expiresInSeconds: number
}

type CxmediaUploadResponse = {
  item: {
    byteSize: number | null
    contentType: string
    createdAt: string | null
    path: string
    privateUrl: string
    publicUrl: string
    transformUrls: {
      crop: string
      resize: string
    }
    visibility: "public" | "private"
  }
}

let cachedSession:
  | {
      accessToken: string
      expiresAt: number
      key: string
    }
  | null = null
let pendingSession:
  | {
      key: string
      promise: Promise<string>
    }
  | null = null

function getCxmediaSettings(config: ServerConfig) {
  const settings = config.media.cxmedia

  if (!settings.enabled) {
    throw new ApplicationError("cxmedia integration is disabled.", {}, 500)
  }

  if (!settings.baseUrl || !settings.email || !settings.password) {
    throw new ApplicationError(
      "CXAPP_MEDIA_CXMEDIA_BASE_URL, CXAPP_MEDIA_CXMEDIA_EMAIL, and CXAPP_MEDIA_CXMEDIA_PASSWORD are required when cxmedia integration is enabled.",
      {},
      500
    )
  }

  return settings
}

async function getAccessToken(config: ServerConfig) {
  const settings = getCxmediaSettings(config)
  const cacheKey = `${settings.baseUrl}|${settings.email}`

  if (cachedSession && cachedSession.key === cacheKey && cachedSession.expiresAt > Date.now() + 30_000) {
    return cachedSession.accessToken
  }

  if (pendingSession && pendingSession.key === cacheKey) {
    return pendingSession.promise
  }

  const sessionPromise = (async () => {
    const response = await fetch(new URL("/api/auth/login", settings.baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: settings.email,
        password: settings.password,
      }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new ApplicationError(
        "Framework media could not authenticate with cxmedia.",
        {
          responseError: payload?.error,
          status: response.status,
        },
        502
      )
    }

    const payload = (await response.json()) as CxmediaSession
    cachedSession = {
      accessToken: payload.accessToken,
      expiresAt: Date.now() + Math.max(payload.expiresInSeconds - 60, 60) * 1000,
      key: cacheKey,
    }

    return payload.accessToken
  })()

  pendingSession = {
    key: cacheKey,
    promise: sessionPromise,
  }

  try {
    return await sessionPromise
  } finally {
    if (pendingSession?.key === cacheKey) {
      pendingSession = null
    }
  }
}

async function authorizedRequest(config: ServerConfig, path: string, init?: RequestInit) {
  const settings = getCxmediaSettings(config)
  const token = await getAccessToken(config)
  const response = await fetch(new URL(path, settings.baseUrl), {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApplicationError(
      payload?.error ?? "Framework media request to cxmedia failed.",
      {
        path,
        status: response.status,
      },
      502
    )
  }

  return response
}

export async function uploadFrameworkMediaToCxmedia(
  config: ServerConfig,
  input: {
    buffer: Buffer
    contentType: string
    originalName: string
  }
) {
  const formData = new FormData()
  const blob = new Blob([input.buffer], {
    type: input.contentType,
  })
  formData.set("file", blob, input.originalName)
  formData.set("prefix", "framework-media")
  formData.set("visibility", "private")

  const response = await authorizedRequest(config, "/api/upload", {
    method: "POST",
    body: formData,
  })

  return (await response.json()) as CxmediaUploadResponse
}

export async function readFrameworkMediaFromCxmedia(
  config: ServerConfig,
  objectPath: string
) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/")
  const response = await authorizedRequest(config, `/api/file/${encodedPath}`)

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  }
}
