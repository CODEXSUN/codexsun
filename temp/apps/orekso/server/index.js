import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import express from 'express'

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  return next()
})

const PORT = Number(process.env.PORT || 3011)
const QDRANT_URL = String(process.env.QDRANT_URL || 'http://qdrant:6333').replace(/\/$/, '')
const OLLAMA_URL = String(process.env.OLLAMA_URL || 'http://ollama:11434').replace(/\/$/, '')
const CODEXSUN_API_URL = String(process.env.CODEXSUN_API_URL || 'http://codexsun-app:4000').replace(/\/$/, '')
const CODEXSUN_WORKSPACE_ROOT = process.env.CODEXSUN_WORKSPACE_ROOT || '/workspace'
const COLLECTION = process.env.OREKSO_COLLECTION || 'codexsun_support'
const AUTO_INDEX = ['1', 'true', 'yes', 'on'].includes(String(process.env.OREKSO_AUTO_INDEX || 'true').trim().toLowerCase())
const EMBED_MODEL = process.env.OREKSO_EMBED_MODEL || 'nomic-embed-text'
const GEN_MODEL = process.env.OREKSO_GEN_MODEL || 'llama3'
const VECTOR_SIZE = Number(process.env.OREKSO_VECTOR_SIZE || 768)
const MAX_FILE_SIZE_BYTES = Number(process.env.OREKSO_MAX_FILE_SIZE_BYTES || 250000)
const ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.html', '.css'])
const EXCLUDED_DIRECTORY_NAMES = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'tmp', 'storage'])
const CHUNK_SIZE = Number(process.env.OREKSO_CHUNK_SIZE || 1200)
const CHUNK_OVERLAP = Number(process.env.OREKSO_CHUNK_OVERLAP || 180)

const assistantState = {
  status: 'offline',
  assistantName: 'Orekso',
  summary: 'Booting support assistant.',
  codexsunUrl: CODEXSUN_API_URL,
  indexedFiles: 0,
  indexedChunks: 0,
  inProgress: false,
  lastIndexedAt: null,
  lastError: null,
}

let currentIndexPromise = null

function uniqueUrls(urls) {
  return Array.from(new Set(urls.filter(Boolean)))
}

function buildCodexsunApiUrlCandidates(configuredUrl) {
  const urls = [configuredUrl]

  try {
    const parsed = new URL(configuredUrl)
    const portSuffix = parsed.port ? `:${parsed.port}` : ''
    if (parsed.hostname === 'codexsun-app') {
      urls.push(`${parsed.protocol}//host.docker.internal${portSuffix}`)
      urls.push(`${parsed.protocol}//172.17.0.1${portSuffix}`)
    }

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      urls.push(`${parsed.protocol}//host.docker.internal${portSuffix}`)
    }
  } catch {
    // Ignore invalid URL fallback generation and use the configured value only.
  }

  return uniqueUrls(urls)
}

const CODEXSUN_API_URL_CANDIDATES = buildCodexsunApiUrlCandidates(CODEXSUN_API_URL)

function createAssistantPayload(overrides = {}) {
  return {
    ...assistantState,
    ...overrides,
  }
}

function setAssistantState(patch) {
  Object.assign(assistantState, patch)
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new Error(
      payload?.error
      || payload?.message
      || payload?.status?.error
      || text
      || response.statusText,
    )
  }

  return payload
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForService(url, label, retries = 60, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Retry
    }

    if (attempt === retries) {
      throw new Error(`${label} not reachable at ${url}`)
    }
    await sleep(delayMs)
  }
}

async function ensureCollection() {
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`)
  if (response.status === 404) {
    await requestJson(`${QDRANT_URL}/collections/${COLLECTION}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      }),
    })
    return
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Unable to verify Qdrant collection: ${text}`)
  }
}

async function recreateCollection() {
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw new Error(`Unable to reset Qdrant collection: ${text}`)
  }

  await ensureCollection()
}

async function embedText(text) {
  const payload = await requestJson(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text,
    }),
  })

  if (!Array.isArray(payload?.embedding) || payload.embedding.length !== VECTOR_SIZE) {
    throw new Error(`Unexpected embedding size from Ollama: ${payload?.embedding?.length ?? 'unknown'}`)
  }

  return payload.embedding
}

async function searchPoints(vector, limit = 5) {
  const payload = await requestJson(`${QDRANT_URL}/collections/${COLLECTION}/points/search`, {
    method: 'POST',
    body: JSON.stringify({
      vector,
      limit,
      with_payload: true,
    }),
  })

  return Array.isArray(payload?.result) ? payload.result : []
}

async function upsertPoints(points) {
  if (points.length === 0) {
    return
  }

  await requestJson(`${QDRANT_URL}/collections/${COLLECTION}/points?wait=true`, {
    method: 'PUT',
    body: JSON.stringify({ points }),
  })
}

function normalizeRelativePath(value) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '')
}

function isExcludedRelativePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath)
  const segments = normalized.split('/').filter(Boolean)
  const fileName = segments[segments.length - 1] || ''

  if (segments.some((segment) => EXCLUDED_DIRECTORY_NAMES.has(segment))) {
    return true
  }

  if (fileName === '.env' || fileName.startsWith('.env.') || fileName === 'error.log' || fileName === 'package-lock.json') {
    return true
  }

  return false
}

async function collectFilesFromPath(targetPath, bucket) {
  const relativePath = normalizeRelativePath(path.relative(CODEXSUN_WORKSPACE_ROOT, targetPath))
  if (relativePath.startsWith('..') || isExcludedRelativePath(relativePath)) {
    return
  }

  const stats = await fs.stat(targetPath)
  if (stats.isDirectory()) {
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    for (const entry of entries) {
      await collectFilesFromPath(path.join(targetPath, entry.name), bucket)
    }
    return
  }

  if (!stats.isFile() || stats.size > MAX_FILE_SIZE_BYTES) {
    return
  }

  const extension = path.extname(targetPath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return
  }

  bucket.push({
    absolutePath: targetPath,
    relativePath,
  })
}

async function fetchKnowledgeManifest() {
  let lastError = null

  for (const candidateUrl of CODEXSUN_API_URL_CANDIDATES) {
    try {
      const manifest = await requestJson(`${candidateUrl}/support/knowledge-manifest`, {
        method: 'GET',
      })
      setAssistantState({
        codexsunUrl: candidateUrl,
      })
      return manifest
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Unable to reach Codexsun knowledge manifest.')
}

async function collectRecommendedFiles(manifest) {
  const files = []

  for (const entry of manifest?.recommendedPaths || []) {
    const absolutePath = path.resolve(CODEXSUN_WORKSPACE_ROOT, entry.path)
    try {
      await collectFilesFromPath(absolutePath, files)
    } catch {
      // Ignore missing or inaccessible recommended paths.
    }
  }

  const uniqueByPath = new Map()
  for (const file of files) {
    if (!uniqueByPath.has(file.relativePath)) {
      uniqueByPath.set(file.relativePath, file)
    }
  }

  return Array.from(uniqueByPath.values())
}

function chunkText(text) {
  const normalized = text.replace(/\r/g, '').trim()
  if (!normalized) {
    return []
  }

  const chunks = []
  let index = 0
  while (index < normalized.length) {
    const nextIndex = Math.min(normalized.length, index + CHUNK_SIZE)
    const chunk = normalized.slice(index, nextIndex).trim()
    if (chunk) {
      chunks.push(chunk)
    }
    if (nextIndex >= normalized.length) {
      break
    }
    index = Math.max(nextIndex - CHUNK_OVERLAP, index + 1)
  }

  return chunks
}

function summarizeSnippet(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 220)
}

function createPointId(filePath, chunkIndex) {
  const digest = createHash('sha1').update(`${filePath}:${chunkIndex}`).digest('hex')
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    digest.slice(12, 16),
    digest.slice(16, 20),
    digest.slice(20, 32),
  ].join('-')
}

async function buildIndex() {
  if (currentIndexPromise) {
    return currentIndexPromise
  }

  currentIndexPromise = (async () => {
    setAssistantState({
      status: 'indexing',
      summary: 'Indexing approved Codexsun knowledge for support answers.',
      inProgress: true,
      lastError: null,
      indexedFiles: 0,
      indexedChunks: 0,
    })

    try {
      await waitForService(`${QDRANT_URL}/collections`, 'Qdrant')
      await waitForService(`${OLLAMA_URL}/api/tags`, 'Ollama')
      await recreateCollection()

      const manifest = await fetchKnowledgeManifest()
      const files = await collectRecommendedFiles(manifest)

      let indexedFiles = 0
      let indexedChunks = 0

      for (const file of files) {
        const raw = await fs.readFile(file.absolutePath, 'utf8')
        const chunks = chunkText(raw)
        if (chunks.length === 0) {
          continue
        }

        const recommendedEntry = (manifest.recommendedPaths || []).find((entry) => {
          const normalizedEntryPath = normalizeRelativePath(entry.path)
          return file.relativePath === normalizedEntryPath || file.relativePath.startsWith(`${normalizedEntryPath}/`)
        })

        const points = []
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const chunk = chunks[chunkIndex]
          const vector = await embedText(`${file.relativePath}\n${chunk}`)
          points.push({
            id: createPointId(file.relativePath, chunkIndex),
            vector,
            payload: {
              text: chunk,
              filePath: file.relativePath,
              module: recommendedEntry?.module || 'platform',
              topic: recommendedEntry?.topic || 'general-support',
              sourceType: recommendedEntry?.sourceType || 'documentation',
              chunkIndex,
            },
          })
        }

        await upsertPoints(points)
        indexedFiles += 1
        indexedChunks += points.length
        setAssistantState({
          indexedFiles,
          indexedChunks,
          summary: `Indexed ${indexedFiles} files and ${indexedChunks} chunks.`,
        })
      }

      setAssistantState({
        status: 'ready',
        summary: indexedChunks > 0
          ? `Orekso is ready with ${indexedFiles} files and ${indexedChunks} indexed chunks.`
          : 'No approved Codexsun knowledge files were indexed.',
        inProgress: false,
        indexedFiles,
        indexedChunks,
        lastIndexedAt: new Date().toISOString(),
      })
    } catch (error) {
      setAssistantState({
        status: 'error',
        summary: 'Indexing failed. Orekso is not ready.',
        inProgress: false,
        lastError: error instanceof Error ? error.message : 'Unknown indexing error.',
      })
      throw error
    } finally {
      currentIndexPromise = null
    }
  })()

  return currentIndexPromise
}

async function generateAnswer({ message, pagePath, workspace, searchResults }) {
  const contexts = searchResults.map((item, index) => {
    const payload = item?.payload || {}
    return [
      `${index + 1}. file: ${payload.filePath || 'unknown'}`,
      `module: ${payload.module || 'unknown'}`,
      `topic: ${payload.topic || 'unknown'}`,
      `text: ${payload.text || ''}`,
    ].join('\n')
  }).join('\n\n')

  const prompt = [
    'You are Orekso, the Codexsun support assistant.',
    'Answer in clear business-user language.',
    'Use only the retrieved Codexsun context.',
    'If the answer is uncertain or missing from context, say that clearly.',
    'Do not invent ERP/accounting facts.',
    '',
    `Workspace: ${workspace || 'unknown'}`,
    `Page path: ${pagePath || 'unknown'}`,
    '',
    'Retrieved context:',
    contexts || 'No relevant context found.',
    '',
    `User question: ${message}`,
    'Answer:',
  ].join('\n')

  const payload = await requestJson(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
      model: GEN_MODEL,
      prompt,
      stream: false,
    }),
  })

  return String(payload?.response || '').trim() || 'I could not produce an answer from the current Codexsun context.'
}

function mapSource(item) {
  const payload = item?.payload || {}
  return {
    filePath: String(payload.filePath || 'unknown'),
    module: String(payload.module || 'platform'),
    topic: String(payload.topic || 'general-support'),
    sourceType: String(payload.sourceType || 'documentation'),
    score: typeof item?.score === 'number' ? item.score : 0,
    snippet: summarizeSnippet(String(payload.text || '')),
  }
}

app.get('/health', async (req, res) => {
  const [qdrantReachable, ollamaReachable] = await Promise.all([
    fetch(`${QDRANT_URL}/collections`).then((response) => response.ok).catch(() => false),
    fetch(`${OLLAMA_URL}/api/tags`).then((response) => response.ok).catch(() => false),
  ])

  res.json({
    status: 'ok',
    services: {
      qdrant: qdrantReachable ? 'online' : 'offline',
      ollama: ollamaReachable ? 'online' : 'offline',
    },
    assistant: createAssistantPayload(),
  })
})

app.get('/status', (req, res) => {
  res.json({
    assistant: createAssistantPayload(),
  })
})

app.post('/index/build', async (req, res) => {
  if (!currentIndexPromise) {
    void buildIndex().catch(() => {
      // state already captured
    })
  }

  res.status(202).json({
    assistant: createAssistantPayload({
      status: assistantState.status === 'ready' ? 'indexing' : assistantState.status,
      summary: 'Index build requested.',
      inProgress: true,
    }),
  })
})

app.post('/chat', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim()
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' })
    }

    if (assistantState.status === 'disabled') {
      return res.status(503).json({ error: 'Orekso is disabled.' })
    }

    if (assistantState.indexedChunks === 0 && !assistantState.inProgress) {
      void buildIndex().catch(() => {
        // state already captured
      })
      return res.status(503).json({ error: 'Orekso is preparing the first Codexsun index. Try again shortly.' })
    }

    const queryVector = await embedText(message)
    const searchResults = await searchPoints(queryVector, 5)
    const answer = await generateAnswer({
      message,
      pagePath: req.body?.pagePath ? String(req.body.pagePath) : null,
      workspace: req.body?.workspace ? String(req.body.workspace) : null,
      searchResults,
    })

    return res.json({
      answer,
      sources: searchResults.map(mapSource),
      assistant: createAssistantPayload(),
    })
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown Orekso chat failure.',
    })
  }
})

async function start() {
  setAssistantState({
    status: 'offline',
    summary: 'Waiting for Qdrant and Ollama.',
  })

  await ensureCollection().catch(() => {
    // Collection is re-created during buildIndex; keep startup non-blocking.
  })

  app.listen(PORT, () => {
    console.log(`Orekso server listening on port ${PORT}`)
  })

  if (AUTO_INDEX) {
    void buildIndex().catch((error) => {
      console.error('Orekso auto-index failed.', error)
    })
  }
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
