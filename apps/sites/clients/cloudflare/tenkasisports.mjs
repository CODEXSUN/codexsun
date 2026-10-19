import {
  receivePublication,
  readPublication,
  publicationEnvelope,
  liveHtml
} from "./tenkasisports.content.mjs";

const backend = "https://codexsun.com";
const publicRoutes = new Map([
  ["/api/sportsclub/registration", { target: "/public/sportsclub/registration", methods: ["GET", "POST"] }],
  ["/api/sportsclub/enroll", { target: "/public/sportsclub/registration", methods: ["POST"] }],
  ["/api/sportsclub/enquiry", { target: "/public/sportsclub/enquiry", methods: ["POST"] }],
  ["/api/sportsclub/programs", { target: "/public/sportsclub/programs", methods: ["GET"] }],
  ["/api/sportsclub/masters", { target: "/public/sportsclub/masters", methods: ["GET"] }],
  ["/api/sportsclub/classes", { target: "/public/sportsclub/classes", methods: ["GET"] }],
  ["/api/sportsclub/sessions", { target: "/public/sportsclub/classes", methods: ["GET"] }],
  ["/api/sportsclub/events", { target: "/public/sportsclub/events", methods: ["GET"] }],
  ["/api/sportsclub/club-profile", { target: "/public/sportsclub/club-profile", methods: ["GET"] }],
  ["/api/sportsclub/health", { target: "/health", methods: ["GET"] }],
  ["/public/sportsclub/registration", { target: "/public/sportsclub/registration", methods: ["GET", "POST"] }],
  ["/public/sportsclub/enroll", { target: "/public/sportsclub/registration", methods: ["POST"] }],
  ["/public/sportsclub/enquiry", { target: "/public/sportsclub/enquiry", methods: ["POST"] }],
  ["/public/sportsclub/programs", { target: "/public/sportsclub/programs", methods: ["GET"] }],
  ["/public/sportsclub/masters", { target: "/public/sportsclub/masters", methods: ["GET"] }],
  ["/public/sportsclub/classes", { target: "/public/sportsclub/classes", methods: ["GET"] }],
  ["/public/sportsclub/sessions", { target: "/public/sportsclub/classes", methods: ["GET"] }],
  ["/public/sportsclub/events", { target: "/public/sportsclub/events", methods: ["GET"] }],
  ["/public/sportsclub/club-profile", { target: "/public/sportsclub/club-profile", methods: ["GET"] }],
  ["/public/sportsclub/health", { target: "/health", methods: ["GET"] }]
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isLocal =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "tenkasisports.localhost";

    if (!isLocal && (url.protocol !== "https:" || url.hostname === "www.tenkasisports.com")) {
      return Response.redirect(`https://tenkasisports.com${url.pathname}${url.search}`, 308);
    }

    if (url.pathname === "/__sites-publish") return receivePublication(request, env);

    if (url.pathname === "/__sites-version") {
      const row = await readPublication(env);
      return Response.json(
        row
          ? {
              siteUuid: env.CODEXSUN_SITES_TENKASISPORTS_SITE_UUID || "c0de0006",
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
      if (row) {
        return Response.json(publicationEnvelope(row), {
          headers: { "Cache-Control": "no-store" }
        });
      }
      if (env.ASSETS) {
        const response = await env.ASSETS.fetch(new Request(new URL("/__sites-content.json", url)));
        const result = secureResponse(response);
        result.headers.set("Cache-Control", "no-store");
        return result;
      }
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname.startsWith("/api/")) return proxyPublic(request, url, env, isLocal);

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!env.ASSETS) {
      return new Response("Not found", { status: 404 });
    }

    const normalized = (url.pathname.replace(/\/$/, "") || "/").toLowerCase();
    const row = /\.[a-z0-9]+$/i.test(url.pathname) ? null : await readPublication(env);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || /\.[a-z0-9]+$/i.test(url.pathname)) {
      return secureResponse(liveHtml(asset, row, normalized));
    }

    const routeAsset = new URL(`${normalized}/index.html`, url);
    const page = await env.ASSETS.fetch(new Request(routeAsset, request));
    if (page.status !== 404) return secureResponse(liveHtml(page, row, normalized));

    const fallback = new URL("/index.html", url);
    const fallbackAsset = await env.ASSETS.fetch(new Request(fallback, request));
    return secureResponse(liveHtml(fallbackAsset, row, normalized));
  }
};

async function proxyPublic(request, url, env, isLocal = false) {
  const path = url.pathname.replace(/^\/api\/platform/, "");
  const route = publicRoutes.get(path);

  if (!route || !route.methods.includes(request.method)) {
    return Response.json(
      { success: false, error: { message: "Public endpoint not found." } },
      { status: 404 }
    );
  }

  if (request.method === "POST") {
    const origin = request.headers.get("Origin") ?? "";
    const isAllowedOrigin =
      origin === "https://tenkasisports.com" ||
      origin === "https://www.tenkasisports.com" ||
      (isLocal && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")));

    if (!isAllowedOrigin) {
      return Response.json(
        { success: false, error: { message: "A same-origin request is required." } },
        { status: 403 }
      );
    }
  }

  const headers = new Headers({ Accept: "application/json" });
  if (request.method === "POST") {
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return new Response("JSON required", { status: 415 });
    }
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
      const client = await sign(`sportsclub-ip.${address}`);
      headers.set("x-codexsun-public-client", client);
      headers.set("x-codexsun-client-time", timestamp);
      headers.set(
        "x-codexsun-client-signature",
        await sign(`sportsclub-client.${timestamp}.${client}`)
      );
    }
  }

  try {
    const apiOrigin = env.CODEXSUN_SPORTSCLUB_API_ORIGIN || backend;
    const corporateId = (env.CODEXSUN_SPORTSCLUB_CORPORATE_ID || "TENKASISPORTS").trim().toUpperCase();

    if (apiOrigin !== backend || corporateId !== "TENKASISPORTS") {
      return tenantPending();
    }

    const context = await fetch(
      `${backend}/api/platform/public/portals/tenkasisports/health`,
      {
        headers: { Accept: "application/json" },
        redirect: "manual",
        signal: AbortSignal.timeout(12000)
      }
    );

    if (!context.ok) return tenantPending();
    const health = await context.clone().json();
    const corpId = (health.data?.corporateId ?? health.corporateId ?? "").trim().toUpperCase();
    if (corpId !== corporateId) {
      return tenantPending();
    }

    if ((path.endsWith("/registration") || path.endsWith("/health")) && request.method === "GET") {
      return secureResponse(
        Response.json(
          {
            success: true,
            data: {
              status: "healthy",
              corporateId,
              domain: "tenkasisports.com",
              actor: health.data?.actor ?? health.actor ?? "public:student",
              name: "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலம் (Tenkasi Sports)"
            }
          },
          { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        )
      );
    }

    const response = await fetch(
      `${backend}/api/platform/public/portals/tenkasisports${route.target}${url.search}`,
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
        error: { message: "The sports club network is temporarily unavailable. Please try again." }
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
        message: "The Tenkasi Sports workspace is being prepared. Please check back shortly."
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
