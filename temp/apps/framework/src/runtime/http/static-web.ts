import fs from 'node:fs/promises'
import path from 'node:path'
import type { ServerResponse } from 'node:http'
import { environment } from '../config/environment'

const contentTypes = new Map<string, string>([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
])

function resolveAssetPath(requestPath: string) {
  const decodedPath = decodeURIComponent(requestPath)
  const normalizedPath = decodedPath.replace(/^\/+/, '')
  return path.resolve(environment.web.distRoot, normalizedPath)
}

function isInsideDistRoot(resolvedPath: string) {
  const relativePath = path.relative(environment.web.distRoot, resolvedPath)
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function resolveCacheControlHeader(requestPath: string, assetExtension: string) {
  if (!assetExtension || requestPath === '/' || requestPath.endsWith('.html')) {
    return 'no-cache, no-store, must-revalidate'
  }

  if (requestPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable'
  }

  return 'public, max-age=3600'
}

export async function serveBuiltWebApp(response: ServerResponse, requestPath: string) {
  if (!(await pathExists(environment.web.distRoot))) {
    return false
  }

  const resolvedAssetPath = resolveAssetPath(requestPath)

  if (!isInsideDistRoot(resolvedAssetPath)) {
    return false
  }

  const assetExtension = path.extname(resolvedAssetPath)

  if (assetExtension) {
    if (!(await pathExists(resolvedAssetPath))) {
      return false
    }

    const assetBuffer = await fs.readFile(resolvedAssetPath)
    response.writeHead(200, {
      'cache-control': resolveCacheControlHeader(requestPath, assetExtension),
      'content-type': contentTypes.get(assetExtension) ?? 'application/octet-stream',
    })
    response.end(assetBuffer)
    return true
  }

  const indexPath = path.join(environment.web.distRoot, 'index.html')
  const indexBuffer = await fs.readFile(indexPath)
  response.writeHead(200, {
    'cache-control': resolveCacheControlHeader(requestPath, ''),
    'content-type': 'text/html; charset=utf-8',
  })
  response.end(indexBuffer)
  return true
}
