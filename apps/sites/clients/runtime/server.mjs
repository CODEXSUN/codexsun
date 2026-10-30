import {
  forwardSiteEnquiries,
  marketingCaptureResponse
} from "@codexsun/sites-api/enquiry-runtime";
import { gzipSync } from "node:zlib";
const compressedBodies = new WeakMap();
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { resolve, dirname, extname, relative, isAbsolute } from "node:path";
import { isIP } from "node:net";
import { fileURLToPath } from "node:url";
import { verifyPublication } from "@codexsun/sites-api/delivery-integrity";
import { ClientContentStore } from "./content/content-store.mjs";
import { enquiryModule, EnquiryRepository, submitEnquiry } from "./enquiry/index.mjs";
import { renderPublicDocument } from "./render.mjs";
import { publicRoutes, sitemap, robots } from "./seo.mjs";
export { renderPublicDocument } from "./render.mjs";
export { sitemap, robots, publicRoutes } from "./seo.mjs";

export function openSiteStore(releaseDirectory, databasePath) {
  const release = JSON.parse(readFileSync(resolve(releaseDirectory, "release.json"), "utf8"));
  const snapshot = verifyPublication(
    JSON.parse(readFileSync(resolve(releaseDirectory, "publication.json"), "utf8"))
  );
  if (
    release.siteUuid !== snapshot.siteUuid ||
    release.siteKey !== snapshot.siteKey ||
    release.siteSlug !== snapshot.siteSlug ||
    release.checksum !== snapshot.checksum
  )
    throw new Error("Release publication identity mismatch.");
  if (!isAbsolute(databasePath)) throw new Error("Use an absolute persistent SQLite path.");
  const relativePath = relative(resolve(releaseDirectory), resolve(databasePath));
  if (!relativePath.startsWith("..") && !isAbsolute(relativePath))
    throw new Error("Keep the database outside the release directory.");
  mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  const store = new ClientContentStore(databasePath, release.siteUuid);
  try {
    const current = store.snapshot();
    if (current && current.siteKey !== release.siteKey)
      throw new Error("Database belongs to another tenant or deployment.");
    if (!current || snapshot.sequence >= current.sequence) store.apply(snapshot);
    if (store.snapshot().siteSlug !== release.siteSlug) throw new Error("Database slug mismatch.");
  } catch (error) {
    store.close();
    throw error;
  }
  chmodSync(databasePath, 0o600);
  return { store, release };
}
export function createSiteServer({ releaseDirectory, databasePath, origin, trustedProxies = [] }) {
  const { store, release } = openSiteStore(releaseDirectory, databasePath);
  origin = origin || release.origin;
  const parsedOrigin = new URL(origin);
  if (
    parsedOrigin.origin !== origin ||
    !(
      parsedOrigin.protocol === "https:" ||
      (parsedOrigin.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(parsedOrigin.hostname))
    )
  ) {
    store.close();
    throw new Error("Use an HTTPS origin, or loopback HTTP for local checks.");
  }
  const root = resolve(releaseDirectory, "public");
  const template = readFileSync(resolve(root, "index.template.html"), "utf8");
  const service = enquiryModule(store.database);
  const enquiries = new EnquiryRepository(store.database);
  const cleanup = setInterval(() => enquiries.expire(), 3600000);
  let forwarding = false;
  const relay = setInterval(() => {
    if (forwarding || !process.env.CODEXSUN_MARKETING_CAPTURE_URL) return;
    forwarding = true;
    void forwardSiteEnquiries(
      enquiries,
      process.env.CODEXSUN_MARKETING_CAPTURE_URL,
      origin,
      release.siteUuid
    )
      .catch(() => console.error("Sites Marketing forwarding failed."))
      .finally(() => {
        forwarding = false;
      });
  }, 15000);
  relay.unref();

  cleanup.unref();
  const staticFiles = new Map();
  const server = createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
    );
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    try {
      if (request.headers.host !== parsedOrigin.host)
        throw Object.assign(new Error("Unrecognized website host."), { status: 421 });
      const path = decodeURIComponent(new URL(request.url, origin).pathname);
      if (
        [
          "/marketing/capture",
          "/content/v1/marketing-capture",
          "/content/v1/marketing-capture.js"
        ].includes(path)
      ) {
        const chunks = [];
        let size = 0;
        if (request.method === "POST")
          for await (const chunk of request) {
            size += chunk.length;
            if (size > 16384)
              throw Object.assign(new Error("The capture payload is too large."), { status: 413 });
            chunks.push(chunk);
          }
        const body = Buffer.concat(chunks).toString("utf8");
        const incoming = new Request(new URL(request.url, origin), {
          method: request.method,
          headers: {
            "content-type": String(request.headers["content-type"] ?? ""),
            origin: String(request.headers.origin ?? "")
          },
          ...(body ? { body } : {})
        });
        const result = await marketingCaptureResponse(
          incoming,
          process.env.CODEXSUN_MARKETING_CAPTURE_URL ?? "",
          origin
        );
        for (const [key, value] of result.headers) response.setHeader(key, value);
        response.writeHead(result.status);
        return response.end(await result.text());
      }
      if (request.method === "POST" && path === "/content/v1/enquiries") {
        let address = request.socket.remoteAddress || "unknown";
        const forwarded = request.headers["x-forwarded-for"];
        if (trustedProxies.includes(address) && typeof forwarded === "string" && isIP(forwarded))
          address = forwarded;
        return await submitEnquiry(request, response, { origin, service, address });
      }
      if (!["GET", "HEAD"].includes(request.method))
        throw Object.assign(new Error("Method not allowed."), { status: 405 });
      if (path === "/health")
        return send(
          response,
          200,
          "application/json",
          JSON.stringify({ status: "ready", client: release.siteSlug }),
          request
        );
      const snapshot = store.snapshot();
      if (path === "/__sites-content")
        return send(
          response,
          200,
          "application/json",
          JSON.stringify({
            success: true,
            data: {
              siteUuid: snapshot.siteUuid,
              siteSlug: snapshot.siteSlug,
              content: snapshot.content,
              blogs: snapshot.blogs
            }
          }),
          request
        );
      if (path === "/site.xml" || path === "/robo.txt") {
        response.writeHead(308, {
          Location: path === "/site.xml" ? "/sitemap.xml" : "/robots.txt"
        });
        return response.end();
      }
      if (path === "/sitemap.xml")
        return send(
          response,
          200,
          "application/xml; charset=utf-8",
          sitemap(snapshot, origin),
          request
        );
      if (path === "/robots.txt")
        return send(response, 200, "text/plain; charset=utf-8", robots(origin), request);
      if (path !== "/" && path.endsWith("/")) {
        response.writeHead(308, { Location: path.slice(0, -1) });
        return response.end();
      }
      if (publicRoutes(snapshot).includes(path))
        return send(
          response,
          200,
          "text/html; charset=utf-8",
          renderPublicDocument(snapshot, path, template, origin),
          request
        );
      const file = resolve(root, "." + path);
      const within = relative(root, file);
      const mime = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
        ".pdf": "application/pdf",
        ".webmanifest": "application/manifest+json",
        ".jpg": "image/jpeg",
        ".webp": "image/webp"
      }[extname(file)];
      if (!within.startsWith("..") && !isAbsolute(within) && mime && existsSync(file)) {
        response.setHeader(
          "Cache-Control",
          path.startsWith("/assets/") ? "public,max-age=31536000,immutable" : "public,max-age=3600"
        );
        if (!staticFiles.has(file)) {
          if (staticFiles.size >= 128) staticFiles.clear();
          staticFiles.set(file, readFileSync(file));
        }
        return send(response, 200, mime, staticFiles.get(file), request);
      }
      return send(
        response,
        404,
        "text/html; charset=utf-8",
        renderPublicDocument(snapshot, path, template, origin),
        request
      );
    } catch (error) {
      const status = Number(error.status) || 500;
      return send(
        response,
        status,
        "application/json",
        JSON.stringify({
          success: false,
          error: {
            message: status === 500 ? "Could not process this request." : error.message,
            ...(error.fields ? { fields: error.fields } : {})
          }
        }),
        request
      );
    }
  });
  return {
    server,
    store,
    enquiries,
    close: async () => {
      clearInterval(cleanup);
      clearInterval(relay);
      await new Promise((resolve) => server.close(resolve));
      store.close();
    }
  };
}
function send(response, status, type, body, request) {
  if (!response.hasHeader("Cache-Control")) response.setHeader("Cache-Control", "no-store");
  let payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  if (/text\/|application\/(json|xml)|image\/svg/.test(type) && payload.length >= 1024) {
    response.setHeader("Vary", "Accept-Encoding");
    const encodings = String(request.headers["accept-encoding"] || "").split(",");
    const gzip = encodings.find((entry) => entry.trim().split(";")[0] === "gzip");
    if (gzip && !/;\s*q=0(?:\.0*)?(?:\s|$)/.test(gzip)) {
      if (!compressedBodies.has(payload))
        compressedBodies.set(payload, gzipSync(payload, { level: 4 }));
      payload = compressedBodies.get(payload);
      response.setHeader("Content-Encoding", "gzip");
    }
  }
  response.setHeader("Content-Length", payload.length);
  response.writeHead(status, { "Content-Type": type });
  response.end(request.method === "HEAD" ? undefined : payload);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const releaseDirectory = resolve(import.meta.dirname, "..");
  if (!process.env.CODEXSUN_SITES_DB)
    throw new Error("CODEXSUN_SITES_DB must point to persistent storage outside the release.");
  const runtime = createSiteServer({
    releaseDirectory,
    databasePath: process.env.CODEXSUN_SITES_DB,
    origin: process.env.CODEXSUN_SITES_ORIGIN,
    trustedProxies: (process.env.CODEXSUN_SITES_TRUSTED_PROXIES || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  });
  const port = Number(process.env.CODEXSUN_SITES_PORT || 8080);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid public site port.");
  runtime.server.listen(port, process.env.CODEXSUN_SITES_HOST || "127.0.0.1", () =>
    console.log(`Site ${runtime.store.snapshot().siteSlug} ready on port ${port}`)
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => runtime.close().then(() => process.exit(0)));
}
