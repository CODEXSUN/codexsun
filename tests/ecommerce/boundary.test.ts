import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..")
const ecommerceServicesRoot = path.join(repositoryRoot, "apps", "ecommerce", "src", "services")
const allowedCoreTableImportFiles = new Set([
  path.join(ecommerceServicesRoot, "projected-product-service.ts"),
  path.join(ecommerceServicesRoot, "order-service.ts"),
])
const storefrontRuntimeServiceFiles = [
  path.join(ecommerceServicesRoot, "projected-product-service.ts"),
  path.join(ecommerceServicesRoot, "catalog-service.ts"),
  path.join(ecommerceServicesRoot, "customer-service.ts"),
  path.join(ecommerceServicesRoot, "order-service.ts"),
  path.join(ecommerceServicesRoot, "storefront-seo-service.ts"),
]

function listFiles(directoryPath: string): string[] {
  const entries = readdirSync(directoryPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const nextPath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(nextPath))
      continue
    }
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(nextPath)
    }
  }

  return files
}

test("ecommerce projected ERP reads stay behind narrow local services", () => {
  const serviceFiles = listFiles(ecommerceServicesRoot)
  const directFrappeImports = serviceFiles.filter((filePath) =>
    /frappe\/src\/services\//.test(readFileSync(filePath, "utf8"))
  )
  const directCoreTableImports = serviceFiles.filter((filePath) => {
    if (allowedCoreTableImportFiles.has(filePath)) {
      return false
    }

    return /core\/database\/table-names\.js/.test(readFileSync(filePath, "utf8"))
  })

  assert.deepEqual(
    directFrappeImports,
    [],
    `Ecommerce service files must not import Frappe service internals directly:\n${directFrappeImports.join("\n")}`
  )
  assert.deepEqual(
    directCoreTableImports,
    [],
    `Projected core-product reads should stay behind the narrow ecommerce read-model service:\n${directCoreTableImports.join("\n")}`
  )
})

test("storefront runtime services do not make direct live network fetch calls", () => {
  const runtimeFilesWithFetch = storefrontRuntimeServiceFiles.filter((filePath) =>
    /\bfetch\s*\(/.test(readFileSync(filePath, "utf8"))
  )

  assert.deepEqual(
    runtimeFilesWithFetch,
    [],
    `Storefront runtime services must not depend on live network fetch calls:\n${runtimeFilesWithFetch.join("\n")}`
  )
})
