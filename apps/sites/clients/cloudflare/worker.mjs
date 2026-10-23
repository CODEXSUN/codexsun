import {
  D1EnquiryRepository,
  D1EnquiryService,
  marketingCaptureResponse,
  forwardSiteEnquiries
} from "@codexsun/sites-api/enquiry-d1";

export function createSiteWorker(publication, origin) {
  const routes = new Set(publication.routes);
  const security = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
  };
  return {
    async fetch(request, env, ctx) {
      try {
        const url = new URL(request.url);
        if (url.origin !== origin) return json({ success: false }, 421);
        if (
          [
            "/marketing/capture",
            "/content/v1/marketing-capture",
            "/content/v1/marketing-capture.js"
          ].includes(url.pathname)
        )
          return await marketingCaptureResponse(
            request,
            env.CODEXSUN_MARKETING_CAPTURE_URL ?? "",
            origin
          );
        if (url.pathname === "/content/v1/enquiries" && request.method === "POST") {
          const response = secure(await submit(request, env));
          if (env.CODEXSUN_MARKETING_CAPTURE_URL && ctx)
            ctx.waitUntil(
              forwardSiteEnquiries(
                repository(env),
                env.CODEXSUN_MARKETING_CAPTURE_URL,
                origin,
                publication.content.siteUuid
              ).catch(() =>
                console.error(JSON.stringify({ event: "sites.marketing.forward-failed" }))
              )
            );
          return response;
        }
        if (!["GET", "HEAD"].includes(request.method)) return json({ success: false }, 405);
        if (url.pathname === "/health") {
          await repository(env).verifyIdentity();
          return json({
            status: "ready",
            client: publication.content.siteSlug,
            sequence: publication.sequence
          });
        }
        if (url.pathname === "/__sites-content")
          return json({ success: true, data: publication.content });
        if (["/site.xml", "/robo.txt"].includes(url.pathname))
          return secure(
            Response.redirect(
              origin + (url.pathname === "/site.xml" ? "/sitemap.xml" : "/robots.txt"),
              308
            )
          );
        if (url.pathname !== "/" && url.pathname.endsWith("/"))
          return secure(Response.redirect(origin + url.pathname.slice(0, -1) + url.search, 308));
        if (routes.has(url.pathname)) {
          url.pathname = url.pathname === "/" ? "/index.html" : `${url.pathname}/index.html`;
          return secure(await env.ASSETS.fetch(new Request(url, request)), request.method);
        }
        if (/\.(?:js|css|svg|png|ico|woff2|pdf|webmanifest|jpg|webp|xml|txt)$/.test(url.pathname))
          return secure(await env.ASSETS.fetch(request), request.method);
        url.pathname = "/404.html";
        const response = await env.ASSETS.fetch(new Request(url, request));
        return secure(
          new Response(response.body, { status: 404, headers: response.headers }),
          request.method
        );
      } catch (error) {
        const status = Number(error.status) || 500;
        if (status === 500) console.error(JSON.stringify({ event: "sites.request.failed" }));
        return json(
          {
            success: false,
            error: {
              message: status === 500 ? "Could not process this request." : error.message,
              ...(error.fields ? { fields: error.fields } : {})
            }
          },
          status
        );
      }
    },
    async scheduled(_event, env, ctx) {
      const store = repository(env);
      await store.verifyIdentity();
      await store.expire();
      if (env.CODEXSUN_MARKETING_CAPTURE_URL) {
        const work = forwardSiteEnquiries(
          store,
          env.CODEXSUN_MARKETING_CAPTURE_URL,
          origin,
          publication.content.siteUuid
        );
        if (ctx) ctx.waitUntil(work);
        else await work;
      }
    }
  };
  function repository(env) {
    return new D1EnquiryRepository(
      env.CODEXSUN_SITES_DB,
      publication.content.siteUuid,
      publication.siteKey
    );
  }
  async function submit(request, env) {
    if (request.headers.get("origin") !== origin)
      throw Object.assign(new Error("Submit the enquiry from this website."), { status: 403 });
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw Object.assign(new Error("Use a JSON enquiry request."), { status: 415 });
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16384) {
          await reader.cancel();
          throw Object.assign(new Error("The enquiry is too large."), { status: 413 });
        }
        chunks.push(value);
      }
    }
    let body;
    try {
      body = JSON.parse(await new Blob(chunks).text());
    } catch {
      throw Object.assign(new Error("Invalid enquiry request."), { status: 400 });
    }
    const service = new D1EnquiryService(repository(env));
    const result = await service.receive(
      body,
      request.headers.get("idempotency-key"),
      request.headers.get("CF-Connecting-IP") || "unknown"
    );
    return json({ success: true, data: result }, 201);
  }
  function json(body, status = 200) {
    return secure(Response.json(body, { status, headers: { "Cache-Control": "no-store" } }));
  }
  function secure(response, method) {
    const result = new Response(method === "HEAD" ? null : response.body, response);
    for (const [key, value] of Object.entries(security)) result.headers.set(key, value);
    if (result.headers.get("content-type")?.includes("text/html"))
      result.headers.set("Cache-Control", "no-cache");
    return result;
  }
}
