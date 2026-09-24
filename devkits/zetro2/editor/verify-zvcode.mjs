import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = new URL("../../../apps/temp/openvscode-server/", import.meta.url);
const editor = new URL("../zvcode/", import.meta.url);
const read = async (base, path) => (await readFile(new URL(path, base), "utf8")).replace(/\r\n/g, "\n");
const product = JSON.parse(await read(editor, "product.json"));
const manifest = JSON.parse(await read(editor, "package.json"));
const lock = JSON.parse(await read(editor, "package-lock.json"));

assert.equal(product.nameShort, "ZVcode");
assert.equal(product.nameLong, "ZVcode");
for (const key of ["applicationName", "serverApplicationName", "urlProtocol", "embedderIdentifier"]) {
  assert.equal(product[key], "zvcode", key);
}
assert.equal(product.dataFolderName, ".zvcode");
assert.equal(product.serverDataFolderName, ".zvcode");
assert.equal(manifest.name, "zvcode");
assert.equal(lock.name, manifest.name);
assert.equal(lock.packages[""].name, manifest.name);
assert.equal(lock.version, manifest.version);
const packaging = await read(editor, "build/gulpfile.reh.ts");
assert.ok(packaging.includes("product.serverApplicationName"));
assert.ok(packaging.includes("product.applicationName"));
for (const path of ["LICENSE.txt", "ThirdPartyNotices.txt"]) {
  assert.equal(await read(editor, path), await read(source, path), path);
}
console.log("ZVcode branding, package identity, packaging hooks, and notices verified.");
