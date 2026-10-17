import {
  deliverySnapshotSchema,
  deliveryPayloadSchema
} from "@codexsun/sites-api/delivery-contract";
const encoder = new TextEncoder();
export async function receivePublication(request, env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!env.CODEXSUN_SITES_PUBLISH_SECRET || !env.CODEXSUN_TCONNECT_CONTENT)
    return new Response("Publishing is unavailable", { status: 503 });
  const timestamp = request.headers.get("x-codexsun-timestamp") ?? "";
  const signature = request.headers.get("x-codexsun-signature") ?? "";
  if (
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp)) > 300000 ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return new Response("Unauthorized", { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return new Response("JSON required", { status: 415 });
  const body = await boundedBody(request, 262144);
  if (body === null) return new Response("Publication too large", { status: 413 });
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.CODEXSUN_SITES_PUBLISH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(signature.match(/../g).map((pair) => parseInt(pair, 16))),
    encoder.encode(`${timestamp}.${body}`)
  );
  if (!valid) return new Response("Unauthorized", { status: 401 });
  let snapshot;
  try {
    snapshot = deliverySnapshotSchema.parse(JSON.parse(body));
  } catch {
    return new Response("Invalid publication", { status: 400 });
  }
  if (
    snapshot.siteUuid !== env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID ||
    snapshot.siteKey !== env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_KEY ||
    snapshot.siteSlug !== "tirupurconnect" ||
    snapshot.content.profile.domain !== "tirupurconnect.com" ||
    !snapshot.content.textile
  )
    return new Response("Wrong client", { status: 403 });
  const { sequence, publishedAt, checksum, ...rawPayload } = snapshot;
  const payload = deliveryPayloadSchema.parse(rawPayload);
  const hash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(payload))))
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (hash !== snapshot.checksum) return new Response("Checksum mismatch", { status: 409 });
  const publication = {
    siteUuid: snapshot.siteUuid,
    siteSlug: snapshot.siteSlug,
    content: snapshot.content,
    blogs: snapshot.blogs
  };
  const values = [
    snapshot.siteUuid,
    snapshot.sequence,
    snapshot.checksum,
    snapshot.publishedAt,
    JSON.stringify(publication)
  ];
  await env.CODEXSUN_TCONNECT_CONTENT.batch([
    env.CODEXSUN_TCONNECT_CONTENT.prepare(
      `INSERT INTO sites_live_publications(site_uuid,version,checksum,published_at,payload_json) VALUES(?,?,?,?,?) ON CONFLICT(site_uuid) DO UPDATE SET version=excluded.version,checksum=excluded.checksum,published_at=excluded.published_at,payload_json=excluded.payload_json WHERE excluded.version>sites_live_publications.version`
    ).bind(...values),
    env.CODEXSUN_TCONNECT_CONTENT.prepare(
      `INSERT OR IGNORE INTO sites_publication_history(site_uuid,version,checksum,published_at,payload_json) VALUES(?,?,?,?,?)`
    ).bind(...values)
  ]);
  const current = await readPublication(env);
  if (current.version === snapshot.sequence && current.checksum !== snapshot.checksum)
    return new Response("Version conflict", { status: 409 });
  return Response.json(
    {
      siteUuid: snapshot.siteUuid,
      version: current.version,
      checksum: current.checksum,
      status: current.version === snapshot.sequence ? "live" : "superseded"
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
export async function readPublication(env) {
  if (!env.CODEXSUN_TCONNECT_CONTENT) return null;
  return env.CODEXSUN_TCONNECT_CONTENT.prepare(
    "SELECT version,checksum,published_at,payload_json FROM sites_live_publications WHERE site_uuid=?"
  )
    .bind(env.CODEXSUN_SITES_TIRUPURCONNECT_SITE_UUID)
    .first();
}
export function publicationEnvelope(row) {
  return {
    success: true,
    data: JSON.parse(row.payload_json),
    meta: { version: row.version, publishedAt: row.published_at, checksum: row.checksum }
  };
}
export function liveHtml(response, row, path) {
  if (!row || !response.headers.get("content-type")?.includes("text/html")) return response;
  const publication = JSON.parse(row.payload_json);
  const serialized = JSON.stringify(publication).replaceAll("<", "\\u003c");
  let rewrite = new HTMLRewriter().on("script#codexsun-sites-publication", {
    element(element) {
      element.setInnerContent(serialized, { html: true });
    }
  });
  if (path === "/")
    rewrite = rewrite
      .on("title", {
        element(element) {
          element.setInnerContent(publication.content.pageTitle);
        }
      })
      .on('meta[name="description"], meta[property="og:description"]', {
        element(element) {
          element.setAttribute("content", publication.content.description);
        }
      })
      .on('meta[property="og:title"]', {
        element(element) {
          element.setAttribute("content", publication.content.pageTitle);
        }
      });
  const result = rewrite.transform(response);
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("X-Codexsun-Publication", String(row.version));
  return result;
}
async function boundedBody(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  let total = 0;
  const chunks = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.length;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
