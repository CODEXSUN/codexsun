import { BrowserWindow, Menu, app } from 'electron'
import { createServer, type Server } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../../../')
const webDistRoot = path.resolve(repoRoot, 'apps/ecommerce/web/dist')
const htmlEntryPath = path.join(webDistRoot, 'index.html')

let runtimeServer: Server | null = null

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function readDesktopEnvironment() {
  const envFilePath = path.resolve(repoRoot, '.env')
  if (!existsSync(envFilePath)) {
    return {}
  }

  return dotenv.parse(readFileSync(envFilePath, 'utf8'))
}

function resolveRendererTarget() {
  return readDesktopEnvironment().CODEXSUN_WEB_URL?.trim() || 'http://localhost:5173'
}

function resolveWorkspaceTarget() {
  const desktopEnvironment = readDesktopEnvironment()
  const configuredWorkspace = (desktopEnvironment.VITE_APP_TARGET || desktopEnvironment.VITE_APP_DEFAULT_WORKSPACE)?.trim().toLowerCase()
  if (configuredWorkspace === 'app') {
    return 'billing'
  }

  if (configuredWorkspace === 'site' || configuredWorkspace === 'ecommerce' || configuredWorkspace === 'billing') {
    return configuredWorkspace
  }

  return 'site'
}

function buildRendererTarget(baseUrl: string) {
  const targetUrl = new URL(baseUrl)
  targetUrl.pathname = '/login'
  targetUrl.searchParams.set('surface', 'desktop')
  targetUrl.searchParams.set('workspace', resolveWorkspaceTarget())
  return targetUrl.toString()
}

function createFallbackMarkup(targetUrl: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>codexsun</title>
    <style>
      :root { color-scheme: light; font-family: "Segoe UI", Tahoma, sans-serif; background: #f5efe5; color: #221f1a; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at top, rgba(220, 187, 132, 0.45), transparent 30%), linear-gradient(180deg, #f8f3eb 0%, #f5efe5 52%, #ece2d4 100%); }
      .panel { width: min(760px, calc(100vw - 48px)); border: 1px solid rgba(72, 58, 39, 0.12); border-radius: 28px; background: rgba(255, 252, 247, 0.88); box-shadow: 0 30px 100px -70px rgba(15, 23, 42, 0.45); padding: 40px; }
      .brand { font-size: 34px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; }
      h1 { margin: 18px 0 0; font-size: 44px; line-height: 1.08; }
      p, li { font-size: 16px; line-height: 1.8; color: #5b5348; }
      code { font-family: Consolas, monospace; color: #1f2937; }
    </style>
  </head>
  <body>
    <main class="panel">
      <div class="brand">CODEXSUN</div>
      <h1>Desktop renderer could not load.</h1>
      <p>The desktop shell tried to open <code>${targetUrl}</code>.</p>
      <ul>
        <li>Run <code>npm run build</code> to generate the local web bundle.</li>
        <li>Or run <code>npm run dev:desktop</code> so the desktop shell can reach the dev server.</li>
      </ul>
    </main>
  </body>
</html>`
}

function resolveAssetPath(requestPath: string) {
  const normalized = decodeURIComponent((requestPath || '/').split('?')[0] || '/')
  const relativePath = normalized === '/' ? '/index.html' : normalized
  const candidatePath = path.normalize(path.join(webDistRoot, relativePath))

  if (!candidatePath.startsWith(webDistRoot)) {
    return null
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath
  }

  return htmlEntryPath
}

async function startRuntimeServer() {
  if (!existsSync(htmlEntryPath)) {
    return null
  }

  const server = createServer((request, response) => {
    const assetPath = resolveAssetPath(request.url || '/')
    if (!assetPath) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    try {
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(assetPath).toLowerCase()] || 'application/octet-stream' })
      response.end(readFileSync(assetPath))
    } catch {
      response.writeHead(500)
      response.end('Unable to read asset.')
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })

  runtimeServer = server
  const address = server.address()
  return address && typeof address !== 'string' ? `http://127.0.0.1:${address.port}` : null
}

async function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: '#f6f2ea',
    title: 'codexsun',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.webContents.on('did-fail-load', async (_event, _errorCode, _errorDescription, validatedUrl) => {
    if (mainWindow.isDestroyed() || validatedUrl.startsWith('data:text/html')) {
      return
    }

    const localRendererBaseUrl = await startRuntimeServer()
    if (localRendererBaseUrl && !validatedUrl.startsWith(localRendererBaseUrl)) {
      await mainWindow.loadURL(buildRendererTarget(localRendererBaseUrl))
      return
    }

    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(createFallbackMarkup(validatedUrl))}`)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  await mainWindow.loadURL(buildRendererTarget(resolveRendererTarget()))
}

void app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  await createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  runtimeServer?.close()
  runtimeServer = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
