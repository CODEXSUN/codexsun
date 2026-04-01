import { BrowserWindow, app, ipcMain } from 'electron'
import { createServer, type Server } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const billingDistRoot = path.resolve(__dirname, '../../web/dist')
const htmlEntryPath = path.join(billingDistRoot, 'index.html')

let mainWindow: BrowserWindow | null = null
let runtimeServer: Server | null = null
let rendererBaseUrl: string | null = null

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
  const envFilePath = path.resolve(__dirname, '../../../.env')
  if (!existsSync(envFilePath)) {
    return {}
  }

  return dotenv.parse(readFileSync(envFilePath, 'utf8'))
}

function getConfiguredRendererBaseUrl() {
  const env = readDesktopEnvironment()
  return env.CODEXSUN_BILLING_WEB_URL?.trim() || env.CODEXSUN_WEB_URL?.trim() || 'http://localhost:5174'
}

function createFallbackMarkup(targetUrl: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>codexsun</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", Tahoma, sans-serif;
        background: #f5efe5;
        color: #221f1a;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(220, 187, 132, 0.45), transparent 30%),
          linear-gradient(180deg, #f8f3eb 0%, #f5efe5 52%, #ece2d4 100%);
      }
      .panel {
        width: min(760px, calc(100vw - 48px));
        border: 1px solid rgba(72, 58, 39, 0.12);
        border-radius: 28px;
        background: rgba(255, 252, 247, 0.88);
        box-shadow: 0 30px 100px -70px rgba(15, 23, 42, 0.45);
        padding: 40px;
      }
      .brand {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: 0.28em;
        text-transform: uppercase;
      }
      .eyebrow {
        display: inline-flex;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(164, 120, 57, 0.12);
        color: #7b4f14;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 0;
        font-size: 44px;
        line-height: 1.08;
      }
      p {
        margin: 18px 0 0;
        font-size: 16px;
        line-height: 1.8;
        color: #5b5348;
      }
      code {
        font-family: Consolas, monospace;
        color: #1f2937;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 26px;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 20px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
      }
      .primary {
        background: #8f5a1d;
        color: #fff9f2;
      }
      .secondary {
        border: 1px solid rgba(72, 58, 39, 0.16);
        color: #221f1a;
        background: rgba(255, 255, 255, 0.76);
      }
      ul {
        margin: 22px 0 0;
        padding-left: 20px;
        color: #4f463d;
        line-height: 1.8;
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <div class="eyebrow">Desktop Runtime</div>
      <div class="brand">CODEXSUN</div>
      <h1>Billing workspace could not load.</h1>
      <p>The desktop shell did not receive a working billing renderer. It tried to open <code>${targetUrl}</code>.</p>
      <ul>
        <li>Run <code>npm run build:billing-web</code> to generate the local billing web bundle.</li>
        <li>Or set <code>CODEXSUN_BILLING_WEB_URL</code> to a reachable billing web URL.</li>
        <li>Then reopen the desktop app.</li>
      </ul>
      <div class="actions">
        <a class="primary" href="https://codexsun.com">codexsun.com</a>
        <a class="secondary" href="${targetUrl}">Open target URL</a>
      </div>
    </main>
  </body>
</html>`
}

function resolveAssetPath(requestPath: string) {
  const normalized = decodeURIComponent((requestPath || '/').split('?')[0] || '/')
  const relativePath = normalized === '/' ? '/index.html' : normalized
  const candidatePath = path.normalize(path.join(billingDistRoot, relativePath))

  if (!candidatePath.startsWith(billingDistRoot)) {
    return null
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath
  }

  return htmlEntryPath
}

async function startBillingRuntimeServer() {
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

    const extension = path.extname(assetPath).toLowerCase()
    const contentType = contentTypes[extension] || 'application/octet-stream'

    try {
      response.writeHead(200, { 'Content-Type': contentType })
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
  if (!address || typeof address === 'string') {
    return null
  }

  return `http://127.0.0.1:${address.port}`
}

async function resolveRendererBaseUrl() {
  if (rendererBaseUrl) {
    return rendererBaseUrl
  }

  const localServerUrl = await startBillingRuntimeServer()
  rendererBaseUrl = localServerUrl || getConfiguredRendererBaseUrl()
  return rendererBaseUrl
}

async function buildRendererUrl(pathname: string) {
  const targetUrl = new URL(await resolveRendererBaseUrl())
  targetUrl.pathname = pathname

  if (pathname === '/login') {
    targetUrl.searchParams.set('workspace', 'billing')
    targetUrl.searchParams.set('surface', 'desktop')
  } else {
    targetUrl.search = ''
  }

  return targetUrl.toString()
}

async function showFallbackScreen(window: BrowserWindow, targetUrl: string) {
  const fallbackMarkup = createFallbackMarkup(targetUrl)
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackMarkup)}`)
}

async function openBillingRoute(window: BrowserWindow, pathname: string) {
  const targetUrl = await buildRendererUrl(pathname)

  try {
    await window.loadURL(targetUrl)
  } catch {
    await showFallbackScreen(window, targetUrl)
  }
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#f4efe6',
    title: 'codexsun',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.webContents.on('did-fail-load', async (_event, _errorCode, _errorDescription, validatedUrl) => {
    if (!mainWindow || mainWindow.isDestroyed() || validatedUrl.startsWith('data:text/html')) {
      return
    }

    await showFallbackScreen(mainWindow, validatedUrl)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  await openBillingRoute(mainWindow, '/login')
}

ipcMain.handle('codexsun-billing:navigate', async (_event, routePath: string) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    throw new Error('Billing window is not available.')
  }

  await openBillingRoute(mainWindow, routePath)

  return { status: 'opened', target: await buildRendererUrl(routePath) }
})

void app.whenReady().then(async () => {
  await createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow()
    }
  })
})

app.on('browser-window-created', (_event, window) => {
  window.on('closed', () => {
    if (window === mainWindow) {
      mainWindow = null
    }
  })
})

app.on('before-quit', () => {
  runtimeServer?.close()
  runtimeServer = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
