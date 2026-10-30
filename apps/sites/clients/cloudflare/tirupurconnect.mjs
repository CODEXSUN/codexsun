import {
  receivePublication,
  readPublication,
  publicationEnvelope,
  liveHtml
} from "./tirupurconnect.content.mjs";
const backend = "https://codexsun.com";
const publicRoutes = new Map([
  ["/public/tconnect/company", ["GET"]],
  ["/public/tconnect/association", ["GET"]],
  ["/public/tconnect/community", ["GET"]],
  ["/public/tconnect/product", ["GET"]],
  ["/public/tconnect/product/search", ["GET"]],
  ["/public/tconnect/credential", ["GET"]],
  ["/public/tconnect/registration", ["GET", "POST"]],
  ["/public/tconnect/buyer/registration", ["POST"]],
  ["/public/tconnect/inquiry", ["POST"]]
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol !== "https:" || url.hostname === "www.tirupurconnect.com")
      return Response.redirect(`https://tirupurconnect.com${url.pathname}${url.search}`, 308);
    if (url.pathname === "/__sites-publish") return receivePublication(request, env);
    if (url.pathname === "/__sites-version") {
      const row = await readPublication(env);
      return Response.json(
        row
          ? {
              siteUuid: env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID,
              version: row.version,
              checksum: row.checksum,
              publishedAt: row.published_at
            }
          : { version: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    if (url.pathname === "/__sites-content") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const row = await readPublication(env);
      if (row)
        return Response.json(publicationEnvelope(row), {
          headers: { "Cache-Control": "no-store" }
        });
      const response = await env.ASSETS.fetch(new Request(new URL("/__sites-content.json", url)));
      const result = secureResponse(response);
      result.headers.set("Cache-Control", "no-store");
      return result;
    }
    if (url.pathname.startsWith("/api/")) return proxyPublic(request, url, env);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });
    const row = /\.[a-z0-9]+$/i.test(url.pathname) ? null : await readPublication(env);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || /\.[a-z0-9]+$/i.test(url.pathname))
      return secureResponse(liveHtml(asset, row, url.pathname));
    const routeAsset = new URL(`${url.pathname.replace(/\/$/, "")}/index.html`, url);
    const page = await env.ASSETS.fetch(new Request(routeAsset, request));
    if (page.status !== 404) return secureResponse(liveHtml(page, row, url.pathname));
    const fallback = new URL("/index.html", url);
    return secureResponse(
      liveHtml(await env.ASSETS.fetch(new Request(fallback, request)), row, url.pathname)
    );
  }
};

async function proxyPublic(request, url, env) {
  const path = url.pathname.replace(/^\/api\/platform/, "");
  if (!publicRoutes.get(path)?.includes(request.method))
    return Response.json(
      { success: false, error: { message: "Public endpoint not found." } },
      { status: 404 }
    );
  if (request.method === "POST" && request.headers.get("Origin") !== "https://tirupurconnect.com")
    return Response.json(
      { success: false, error: { message: "A same-origin request is required." } },
      { status: 403 }
    );
  const headers = new Headers({ Accept: "application/json" });
  if (request.method === "POST") {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return new Response("JSON required", { status: 415 });
    headers.set("Content-Type", "application/json");
    headers.set("Origin", backend);
    const address = request.headers.get("CF-Connecting-IP");
    if (address && env.CODEXSUN_SITES_PUBLISH_SECRET) {
      const timestamp = String(Date.now());
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(env.CODEXSUN_SITES_PUBLISH_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sign = async (value) =>
        Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
      const client = await sign(`tconnect-ip.${address}`);
      headers.set("x-codexsun-public-client", client);
      headers.set("x-codexsun-client-time", timestamp);
      headers.set(
        "x-codexsun-client-signature",
        await sign(`tconnect-client.${timestamp}.${client}`)
      );
    }
  }
  try {
    if (
      env.CODEXSUN_TCONNECT_API_ORIGIN !== backend ||
      env.CODEXSUN_TCONNECT_CORPORATE_ID !== "TIRUPURCONNECT"
    )
      return tenantPending();
    const context = await fetch(
      `${backend}/api/platform/public/portals/tirupurconnect/public/tconnect/registration`,
      {
        headers: { Accept: "application/json" },
        redirect: "manual",
        signal: AbortSignal.timeout(12000)
      }
    );
    if (!context.ok) return tenantPending();
    const registration = await context.clone().json();
    if (
      !registration.success ||
      registration.data?.corporateId?.trim().toUpperCase() !== env.CODEXSUN_TCONNECT_CORPORATE_ID
    )
      return tenantPending();
    if (path === "/public/tconnect/registration" && request.method === "GET")
      return secureResponse(
        new Response(JSON.stringify(registration), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        })
      );
    const response = await fetch(
      `${backend}/api/platform/public/portals/tirupurconnect${path}${url.search}`,
      {
        method: request.method,
        headers,
        body: request.method === "POST" ? request.body : null,
        redirect: "manual",
        signal: AbortSignal.timeout(15000)
      }
    );
    const result = new Response(response.body, response);
    result.headers.delete("set-cookie");
    result.headers.set("Cache-Control", "no-store");
    return secureResponse(result);
  } catch {
    return Response.json(
      {
        success: false,
        error: { message: "The business network is temporarily unavailable. Please try again." }
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function tenantPending() {
  return Response.json(
    {
      success: false,
      error: {
        code: "TENANT_SETUP_PENDING",
        message: "The Tirupur Connect workspace is being prepared. Please check back shortly."
      }
    },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

function secureResponse(response) {
  const result = new Response(response.body, response);
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  result.headers.set("X-Frame-Options", "SAMEORIGIN");
  return result;
}
