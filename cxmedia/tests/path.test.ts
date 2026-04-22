import assert from "node:assert/strict"
import test from "node:test"

import {
  sanitizeObjectPath,
  sanitizePrefix,
  slugifyFileName,
} from "../src/http/path.js"

test("path helpers normalize valid object paths and prefixes", () => {
  assert.equal(sanitizeObjectPath("\\folder\\\\nested\\photo 1.png"), "folder/nested/photo 1.png")
  assert.equal(sanitizePrefix("\\folder\\\\nested"), "folder/nested/")
  assert.equal(sanitizePrefix(undefined), "")
  assert.equal(slugifyFileName("Summer Banner 2026.PNG"), "summer-banner-2026.png")
})

test("path helpers reject traversal attempts and blank object paths", () => {
  assert.throws(() => sanitizeObjectPath(""), {
    message: "Object path is required.",
  })
  assert.throws(() => sanitizeObjectPath("../private/photo.png"), {
    message: "Object path cannot include '..'.",
  })
  assert.throws(() => sanitizePrefix("../private"), {
    message: "Prefix cannot include '..'.",
  })
})
