import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  getPublishedBrandAssetPublicUrl,
  publishCompanyBrandAssets,
  readPublishedBrandAsset,
} from "../../apps/cxapp/src/services/company-brand-assets-service.js"

test("published brand asset url prefers managed runtime logo, then legacy public logo, then null", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-urls-"))
  const publicRoot = path.join(tempRoot, "public")
  const storageSourceRoot = path.join(tempRoot, "storage", "source")

  try {
    const config = getServerConfig(tempRoot)

    mkdirSync(publicRoot, { recursive: true })
    assert.equal(await getPublishedBrandAssetPublicUrl(config, "primary"), null)

    writeFileSync(path.join(publicRoot, "logo.svg"), "<svg>legacy-primary</svg>", "utf8")
    assert.equal(await getPublishedBrandAssetPublicUrl(config, "primary"), "/logo.svg")

    mkdirSync(storageSourceRoot, { recursive: true })
    writeFileSync(
      path.join(storageSourceRoot, "primary.svg"),
      '<svg viewBox="0 0 100 40"><rect width="100" height="40" fill="#111"/></svg>',
      "utf8"
    )

    const response = await publishCompanyBrandAssets(
      {} as never,
      config,
      {
        primary: {
          sourceUrl: "/storage/source/primary.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 12,
          offsetY: 8,
          scale: 100,
          fillColor: "#111111",
          hoverFillColor: "#8b5e34",
        },
        dark: {
          sourceUrl: "/storage/source/primary.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#ffffff",
          hoverFillColor: "#f0c48a",
        },
        favicon: {
          sourceUrl: "/storage/source/primary.svg",
          canvasWidth: 64,
          canvasHeight: 64,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#8b5e34",
          hoverFillColor: "#5a3a1b",
        },
      }
    )

    assert.equal(
      await getPublishedBrandAssetPublicUrl(config, "primary"),
      `/logo.svg?v=${encodeURIComponent(response.item.version)}`
    )
    assert.equal(
      await getPublishedBrandAssetPublicUrl(config, "dark"),
      `/logo-dark.svg?v=${encodeURIComponent(response.item.version)}`
    )
    assert.equal(
      await getPublishedBrandAssetPublicUrl(config, "favicon"),
      `/favicon.svg?v=${encodeURIComponent(response.item.version)}`
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("company brand asset publishing backs up and replaces direct public brand files", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-assets-"))
  const publicRoot = path.join(tempRoot, "public")
  const activeBrandRoot = path.join(tempRoot, "storage", "branding", "active")
  const storageSourceRoot = path.join(tempRoot, "storage", "source")

  try {
    const config = getServerConfig(tempRoot)

    mkdirSync(publicRoot, { recursive: true })
    mkdirSync(storageSourceRoot, { recursive: true })

    writeFileSync(path.join(publicRoot, "logo.svg"), "<svg>legacy-primary</svg>", "utf8")
    writeFileSync(path.join(publicRoot, "logo-dark.svg"), "<svg>legacy-dark</svg>", "utf8")
    writeFileSync(path.join(publicRoot, "favicon.svg"), "<svg>legacy-favicon</svg>", "utf8")
    writeFileSync(
      path.join(storageSourceRoot, "primary.svg"),
      '<svg viewBox="0 0 100 40"><rect width="100" height="40" fill="#111"/><text x="50" y="26" text-anchor="middle" fill="#fff">Brand</text></svg>',
      "utf8"
    )
    writeFileSync(
      path.join(storageSourceRoot, "dark.svg"),
      '<svg viewBox="0 0 100 40"><rect width="100" height="40" fill="#000"/><text x="50" y="26" text-anchor="middle" fill="#f8e7c8">Brand Dark</text></svg>',
      "utf8"
    )
    writeFileSync(
      path.join(storageSourceRoot, "favicon.svg"),
      '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#8b5e34"/><text x="32" y="39" text-anchor="middle" fill="#fff" font-size="24">B</text></svg>',
      "utf8"
    )

    const response = await publishCompanyBrandAssets(
      {} as never,
      config,
      {
        primary: {
          sourceUrl: "/storage/source/primary.svg",
          canvasWidth: 360,
          canvasHeight: 140,
          offsetX: 18,
          offsetY: 12,
          scale: 125,
          fillColor: "#224466",
          hoverFillColor: "#8b5e34",
        },
        dark: {
          sourceUrl: "/storage/source/dark.svg",
          canvasWidth: 360,
          canvasHeight: 140,
          offsetX: 10,
          offsetY: 6,
          scale: 110,
          fillColor: "#f2d7aa",
          hoverFillColor: "#f0c48a",
        },
        favicon: {
          sourceUrl: "/storage/source/favicon.svg",
          canvasWidth: 72,
          canvasHeight: 72,
          offsetX: 4,
          offsetY: 5,
          scale: 90,
          fillColor: "#9b5f2d",
          hoverFillColor: "#5a3a1b",
        },
      }
    )

    assert.equal(response.item.format, "svg")
    assert.match(response.item.backupPath ?? "", /storage[\\/]backups[\\/]branding[\\/]logo-/)
    assert.equal(existsSync(response.item.backupPath ?? ""), true)
    assert.equal(readFileSync(response.item.backupPath ?? "", "utf8"), "<svg>legacy-primary</svg>")
    assert.equal(
      readFileSync(response.item.backupPaths.dark ?? "", "utf8"),
      "<svg>legacy-dark</svg>"
    )
    assert.equal(
      readFileSync(response.item.backupPaths.favicon ?? "", "utf8"),
      "<svg>legacy-favicon</svg>"
    )
    assert.equal(
      response.item.publicUrl,
      `/logo.svg?v=${encodeURIComponent(response.item.version)}`
    )
    assert.equal(
      response.item.publicUrls.dark,
      `/logo-dark.svg?v=${encodeURIComponent(response.item.version)}`
    )
    assert.equal(
      response.item.publicUrls.favicon,
      `/favicon.svg?v=${encodeURIComponent(response.item.version)}`
    )

    const publishedLogo = readFileSync(path.join(publicRoot, "logo.svg"), "utf8")
    const publishedDarkLogo = readFileSync(path.join(publicRoot, "logo-dark.svg"), "utf8")
    const publishedFavicon = readFileSync(path.join(publicRoot, "favicon.svg"), "utf8")
    const storedLogo = readFileSync(path.join(activeBrandRoot, "logo.svg"), "utf8")
    const storedDarkLogo = readFileSync(path.join(activeBrandRoot, "logo-dark.svg"), "utf8")
    const storedFavicon = readFileSync(path.join(activeBrandRoot, "favicon.svg"), "utf8")

    assert.match(publishedLogo, /width="360"/)
    assert.match(publishedLogo, /height="140"/)
    assert.match(publishedLogo, /x="18"/)
    assert.match(publishedLogo, /y="12"/)
    assert.match(publishedLogo, /fill="#224466"/)
    assert.match(publishedDarkLogo, /fill="#f2d7aa"/)
    assert.match(publishedDarkLogo, /x="10"/)
    assert.match(publishedFavicon, /width="72"/)
    assert.match(publishedFavicon, /fill="#9b5f2d"/)
    assert.equal(storedLogo, publishedLogo)
    assert.equal(storedDarkLogo, publishedDarkLogo)
    assert.equal(storedFavicon, publishedFavicon)

    const favicon = await readPublishedBrandAsset(config, "favicon")
    const dark = await readPublishedBrandAsset(config, "dark")

    assert.equal(favicon.mimeType, "image/svg+xml")
    assert.match(favicon.content.toString("utf8"), /fill="#9b5f2d"/)
    assert.match(dark.content.toString("utf8"), /fill="#f2d7aa"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("company brand asset publishing accepts utf16 svg source files", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-assets-utf16-"))
  const publicRoot = path.join(tempRoot, "public")
  const storageSourceRoot = path.join(tempRoot, "storage", "source")

  try {
    const config = getServerConfig(tempRoot)

    mkdirSync(publicRoot, { recursive: true })
    mkdirSync(storageSourceRoot, { recursive: true })

    const utf16Svg =
      '<?xml version="1.0" encoding="UTF-16"?><svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="40" fill="#662c90"/></svg>'
    const utf16Bytes = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(utf16Svg, "utf16le"),
    ])

    writeFileSync(path.join(publicRoot, "logo.svg"), "<svg>legacy-primary</svg>", "utf8")
    writeFileSync(
      path.join(storageSourceRoot, "utf16-primary.svg"),
      utf16Bytes
    )

    const response = await publishCompanyBrandAssets(
      {} as never,
      config,
      {
        primary: {
          sourceUrl: "/storage/source/utf16-primary.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 6,
          offsetY: 4,
          scale: 100,
          fillColor: "#224466",
          hoverFillColor: "#8b5e34",
        },
        dark: {
          sourceUrl: "/storage/source/utf16-primary.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#ffffff",
          hoverFillColor: "#f0c48a",
        },
        favicon: {
          sourceUrl: "/storage/source/utf16-primary.svg",
          canvasWidth: 64,
          canvasHeight: 64,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#8b5e34",
          hoverFillColor: "#5a3a1b",
        },
      }
    )

    assert.equal(response.item.format, "svg")
    assert.match(
      readFileSync(path.join(publicRoot, "logo.svg"), "utf8"),
      /fill="#224466"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("company brand asset publishing strips xml wrapper tags and metadata before parsing", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-assets-sanitize-"))
  const publicRoot = path.join(tempRoot, "public")
  const storageSourceRoot = path.join(tempRoot, "storage", "source")

  try {
    const config = getServerConfig(tempRoot)

    mkdirSync(publicRoot, { recursive: true })
    mkdirSync(storageSourceRoot, { recursive: true })

    writeFileSync(
      path.join(storageSourceRoot, "wrapped.svg"),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
        "<!-- exported by editor -->",
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40">',
        '  <metadata id="editor-meta">ignore me</metadata>',
        '  <rect width="100" height="40" fill="#662c90"/>',
        "</svg>",
      ].join("\n"),
      "utf8"
    )

    const response = await publishCompanyBrandAssets(
      {} as never,
      config,
      {
        primary: {
          sourceUrl: "/storage/source/wrapped.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#224466",
          hoverFillColor: "#8b5e34",
        },
        dark: {
          sourceUrl: "/storage/source/wrapped.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#ffffff",
          hoverFillColor: "#f0c48a",
        },
        favicon: {
          sourceUrl: "/storage/source/wrapped.svg",
          canvasWidth: 64,
          canvasHeight: 64,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#8b5e34",
          hoverFillColor: "#5a3a1b",
        },
      }
    )

    const publishedLogo = readFileSync(path.join(publicRoot, "logo.svg"), "utf8")

    assert.equal(response.item.format, "svg")
    assert.match(publishedLogo, /fill="#224466"/)
    assert.doesNotMatch(publishedLogo, /<\?xml/i)
    assert.doesNotMatch(publishedLogo, /<!DOCTYPE/i)
    assert.doesNotMatch(publishedLogo, /<metadata/i)
    assert.doesNotMatch(publishedLogo, /exported by editor/i)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("company brand asset publishing applies token color overrides without flattening all svg colors", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-assets-token-mode-"))
  const publicRoot = path.join(tempRoot, "public")
  const storageSourceRoot = path.join(tempRoot, "storage", "source")

  try {
    const config = getServerConfig(tempRoot)

    mkdirSync(publicRoot, { recursive: true })
    mkdirSync(storageSourceRoot, { recursive: true })

    writeFileSync(
      path.join(storageSourceRoot, "token.svg"),
      '<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="40" fill="#111111" stroke="#662c90" stroke-width="4"/><circle cx="30" cy="20" r="10" fill="#f2d7aa"/></svg>',
      "utf8"
    )

    await publishCompanyBrandAssets(
      {} as never,
      config,
      {
        primary: {
          sourceUrl: "/storage/source/token.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#000000",
          hoverFillColor: "#8b5e34",
          colorMode: "token",
          colorOverrides: [
            {
              source: "#111111",
              target: "#224466",
            },
            {
              source: "#662c90",
              target: "#335577",
            },
          ],
        },
        dark: {
          sourceUrl: "/storage/source/token.svg",
          canvasWidth: 320,
          canvasHeight: 120,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#ffffff",
          hoverFillColor: "#f0c48a",
          colorMode: "token",
          colorOverrides: [],
        },
        favicon: {
          sourceUrl: "/storage/source/token.svg",
          canvasWidth: 64,
          canvasHeight: 64,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: "#8b5e34",
          hoverFillColor: "#5a3a1b",
          colorMode: "token",
          colorOverrides: [],
        },
      }
    )

    const publishedLogo = readFileSync(path.join(publicRoot, "logo.svg"), "utf8")
    const publishedDarkLogo = readFileSync(path.join(publicRoot, "logo-dark.svg"), "utf8")

    assert.match(publishedLogo, /fill="#224466"/)
    assert.match(publishedLogo, /stroke="#335577"/)
    assert.match(publishedLogo, /fill="#f2d7aa"/)
    assert.match(publishedDarkLogo, /fill="#111111"/)
    assert.match(publishedDarkLogo, /stroke="#662c90"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
