import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { once } from "node:events"
import test from "node:test"

const thumborImage = "thumbororg/thumbor@sha256:8e10758c3c2306bfd9ec200aadc2752250fe8187fb0611e7ca9d831d508d80f5"

function commandSucceeds(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    timeout: 15_000,
  })

  return result.status === 0
}

function createBmpFixture(width: number, height: number) {
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const pixelDataSize = rowSize * height
  const fileSize = 54 + pixelDataSize
  const buffer = Buffer.alloc(fileSize)

  buffer.write("BM", 0, "ascii")
  buffer.writeUInt32LE(fileSize, 2)
  buffer.writeUInt32LE(54, 10)
  buffer.writeUInt32LE(40, 14)
  buffer.writeInt32LE(width, 18)
  buffer.writeInt32LE(height, 22)
  buffer.writeUInt16LE(1, 26)
  buffer.writeUInt16LE(24, 28)
  buffer.writeUInt32LE(pixelDataSize, 34)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rowOffset = 54 + (height - y - 1) * rowSize
      const pixelOffset = rowOffset + x * 3

      buffer[pixelOffset] = (x * 17) % 256
      buffer[pixelOffset + 1] = (y * 29) % 256
      buffer[pixelOffset + 2] = ((x + y) * 11) % 256
    }
  }

  return buffer
}

async function getFreePort() {
  const server = createServer()
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()

  if (!address || typeof address === "string") {
    server.close()
    throw new Error("Failed to allocate a free port.")
  }

  const { port } = address
  server.close()
  await once(server, "close")
  return port
}

async function waitForSuccessfulFetch(url: string, timeoutMs: number) {
  const startedAt = Date.now()
  let lastError: Error | null = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return response
      }

      lastError = new Error(`Thumbor returned ${response.status}.`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown fetch failure.")
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw lastError ?? new Error("Thumbor did not become ready.")
}

test(
  "thumbor container returns transformed image bytes for resize and crop requests",
  { timeout: 120_000 },
  async (t) => {
    if (!commandSucceeds("docker", ["version"])) {
      t.skip("Docker is not available.")
      return
    }

    if (!commandSucceeds("docker", ["info"])) {
      t.skip("Docker daemon is not running.")
      return
    }

    const sourceImage = createBmpFixture(48, 36)
    const originPort = await getFreePort()
    const thumborPort = await getFreePort()
    const containerName = `cxmedia-thumbor-test-${process.pid}-${Date.now()}`
    const originServer = createServer((request, response) => {
      if (request.url !== "/fixture.bmp") {
        response.writeHead(404)
        response.end("Not found.")
        return
      }

      response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": String(sourceImage.byteLength),
        "content-type": "image/bmp",
      })
      response.end(sourceImage)
    })

    originServer.listen(originPort, "127.0.0.1")
    await once(originServer, "listening")

    try {
      execFileSync(
        "docker",
        [
          "run",
          "-d",
          "--rm",
          "--name",
          containerName,
          "-p",
          `${thumborPort}:8888`,
          "--add-host",
          "host.docker.internal:host-gateway",
          thumborImage,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
          timeout: 60_000,
        }
      )

      const sourceUrl = encodeURIComponent(
        `http://host.docker.internal:${originPort}/fixture.bmp`
      )
      const resizeUrl = `http://127.0.0.1:${thumborPort}/unsafe/fit-in/24x24/filters:format(webp)/${sourceUrl}`
      const cropUrl = `http://127.0.0.1:${thumborPort}/unsafe/24x24/smart/filters:format(jpeg)/${sourceUrl}`

      const resizeResponse = await waitForSuccessfulFetch(resizeUrl, 45_000)
      const resizeBytes = Buffer.from(await resizeResponse.arrayBuffer())

      assert.match(resizeResponse.headers.get("content-type") ?? "", /^image\/webp\b/)
      assert.equal(resizeBytes.subarray(0, 4).toString("ascii"), "RIFF")
      assert.equal(resizeBytes.subarray(8, 12).toString("ascii"), "WEBP")
      assert.notDeepEqual(resizeBytes, sourceImage)

      const cropResponse = await waitForSuccessfulFetch(cropUrl, 20_000)
      const cropBytes = Buffer.from(await cropResponse.arrayBuffer())

      assert.match(cropResponse.headers.get("content-type") ?? "", /^image\/jpeg\b/)
      assert.equal(cropBytes[0], 0xff)
      assert.equal(cropBytes[1], 0xd8)
      assert.equal(cropBytes.at(-2), 0xff)
      assert.equal(cropBytes.at(-1), 0xd9)
      assert.notDeepEqual(cropBytes, sourceImage)
    } finally {
      originServer.close()
      await once(originServer, "close")

      spawnSync("docker", ["stop", containerName], {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 30_000,
      })
    }
  }
)
