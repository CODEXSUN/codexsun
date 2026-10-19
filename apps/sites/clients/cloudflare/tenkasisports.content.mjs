import {
  deliverySnapshotSchema,
  deliveryPayloadSchema
} from "@codexsun/sites-api/delivery-contract";

const encoder = new TextEncoder();

export async function receivePublication(request, env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (
    !env.CODEXSUN_SITES_PUBLISH_SECRET ||
    !env.CODEXSUN_SITES_TENKASISPORTS_SITE_KEY ||
    !env.CODEXSUN_TENKASISPORTS_CONTENT
  )
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
  const expectedUuid = env.CODEXSUN_SITES_TENKASISPORTS_SITE_UUID || "c0de0006";
  if (
    snapshot.siteUuid !== expectedUuid ||
    snapshot.siteKey !== env.CODEXSUN_SITES_TENKASISPORTS_SITE_KEY ||
    snapshot.siteSlug !== "tenkasisports"
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
  await env.CODEXSUN_TENKASISPORTS_CONTENT.batch([
    env.CODEXSUN_TENKASISPORTS_CONTENT.prepare(
      `INSERT INTO sites_live_publications(site_uuid,version,checksum,published_at,payload_json) VALUES(?,?,?,?,?) ON CONFLICT(site_uuid) DO UPDATE SET version=excluded.version,checksum=excluded.checksum,published_at=excluded.published_at,payload_json=excluded.payload_json WHERE excluded.version>sites_live_publications.version`
    ).bind(...values),
    env.CODEXSUN_TENKASISPORTS_CONTENT.prepare(
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
  if (!env.CODEXSUN_TENKASISPORTS_CONTENT) return null;
  const uuid = env.CODEXSUN_SITES_TENKASISPORTS_SITE_UUID || "c0de0006";
  return env.CODEXSUN_TENKASISPORTS_CONTENT.prepare(
    "SELECT version,checksum,published_at,payload_json FROM sites_live_publications WHERE site_uuid=?"
  )
    .bind(uuid)
    .first();
}

export function publicationEnvelope(row) {
  return {
    success: true,
    data: JSON.parse(row.payload_json),
    meta: { version: row.version, publishedAt: row.published_at, checksum: row.checksum }
  };
}

export const routeMetadata = {
  "/": {
    title: "Tenkasi District Sports Club | Sivakalai Gurukulam",
    description: "தென்காசி மாவட்ட விளையாட்டுக் கழகம் · தாயகம் சிவகலை குருகுலம். ஆசான் தி. வீரபாண்டியன் வழிகாட்டலில் சிலம்பம், வர்மக்கலை மற்றும் தற்காப்புப் பயிற்சி.",
    h1: "Tenkasi District Sports Club",
    summary: "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன் வழிகாட்டலில் 12,000-க்கும் மேற்பட்ட மாணாக்கர்களை உருவாக்கிய பாரம்பரிய சிலம்பம், வர்மக்கலை மற்றும் தற்காப்புப் பயிற்சிக் களம்."
  },
  "/about": {
    title: "About | Tenkasi District Sports Club | Sivakalai Gurukulam",
    description: "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலத்தின் வரலாறு, ஆசான் தி. வீரபாண்டியன் அவர்களின் பாரம்பரிய சிலம்பக் கலை மரபு மற்றும் குரு பரம்பரை.",
    h1: "குருகுல மரபு & வரலாறு",
    summary: "2000 முதல் தென்காசி மண்ணில் 12,000-க்கும் மேற்பட்ட மாணாக்கர்களுக்கு பாரம்பரிய சிலம்பம் மற்றும் வர்மக்கலை பயிற்றுவித்து வரும் வரலாற்றுப் பின்னணி."
  },
  "/syllabus": {
    title: "பாடத்திட்டம் (Syllabus & Martial Arts) | Tenkasi District Sports Club",
    description: "சிலம்பம், வர்மக் கலை, அடிமுறை, சுவடு முறை, மான் கொம்பு, சுருள் வாள், மற்றும் பாரம்பரிய தற்காப்புக் கலைப் பாடத்திட்டம்.",
    h1: "பாரம்பரிய கலைப் பாடத்திட்டம்",
    summary: "ஆரம்ப நிலை, இடைநிலை மற்றும் உயர்நிலை என முறைப்படுத்தப்பட்ட சிலம்பம், சுவடு முறை, வர்மக்கலை மற்றும் ஆயுதப் பயிற்சிகள்."
  },
  "/classes": {
    title: "வகுப்புகள் (Training Batches & Schedule) | Tenkasi District Sports Club",
    description: "தென்காசி சிவகலை குருகுலத்தின் நேரடிப் பயிற்சி வகுப்புகள், பயிற்சிக் கால அட்டவணை மற்றும் பயிற்சி மையங்கள்.",
    h1: "பயிற்சி வகுப்புகள் & நேரங்கள்",
    summary: "காலை மற்றும் மாலை நேர நேரடிப் பயிற்சி வகுப்புகள். குழந்தைகள், மாணவர்கள் மற்றும் பெரியவர்களுக்கான பிரத்யேகப் பயிற்சிகள்."
  },
  "/masters": {
    title: "ஆசான்கள் & பயிற்றுநர்கள் (Masters & Lineage) | Tenkasi District Sports Club",
    description: "சிவகலை சிலம்பக் குருகுல ஆசான்கள், மூத்த பயிற்றுநர்கள் மற்றும் குரு-சீடர் பாரம்பரியம்.",
    h1: "குருகுல ஆசான்கள் & பயிற்றுநர்கள்",
    summary: "கலைச்சுடர்மணி ஆசான் தி. வீரபாண்டியன் மற்றும் தகுதிவாய்ந்த மூத்த பயிற்றுநர்களின் வழிகாட்டுதல்."
  },
  "/events": {
    title: "நிகழ்வுகள் & போட்டிகள் (Events & Tournaments) | Tenkasi District Sports Club",
    description: "தென்காசி சிலம்பப் போட்டிகள், கலை நிகழ்ச்சிகள், பயிற்சி முகாம்கள் மற்றும் சான்றிதழ் வழங்கும் நிகழ்வுகள்.",
    h1: "நிகழ்வுகள், போட்டிகள் & களப்பயிற்சி",
    summary: "மாநில மற்றும் தேசிய அளவிலான சிலம்பப் போட்டிகள், அரங்கேற்றம் மற்றும் சிறப்புப் பயிற்சி முகாம்கள்."
  },
  "/gallery": {
    title: "புகைப்படத் தொகுப்பு (Gallery) | Tenkasi District Sports Club",
    description: "சிவகலை குருகுல மாணவர்களின் சிலம்பப் பயிற்சி, அரங்கேற்றம், ஆசான் படங்கள் மற்றும் வரலாற்றுத் தொகுப்புகள்.",
    h1: "குருகுல புகைப்படத் தொகுப்பு",
    summary: "பயிற்சிக் களங்கள், சிலம்ப அரங்கேற்றம், ஆசான் உருவப்படங்கள் மற்றும் வரலாற்று ஆவணப் புகைப்படங்கள்."
  },
  "/blogs": {
    title: "பயிற்சிக் கட்டுரைகள் | Tenkasi District Sports Club",
    description: "சிலம்பம், குருகுல மரபு மற்றும் பாதுகாப்பான பயிற்சி பற்றிய தென்காசி மாவட்ட விளையாட்டுக் கழகக் கட்டுரைகள்.",
    h1: "பயிற்சிக் கட்டுரைகள்",
    summary: "சிலம்பப் பயிற்சியின் அடிப்படைகள் முதல் குருகுலக் களத் தருணங்கள் வரை ஐந்து கட்டுரைகள்."
  },
  "/blogs/silambam-first-steps": {
    title: "சிலம்பப் பயிற்சியின் முதல் படிகள் | Tenkasi District Sports Club",
    description: "சமநிலை, பிரிவு நிலை, சாண் பிடி ஆகிய அடிப்படைகளிலிருந்து சிலம்பப் பயிற்சி எப்படித் தொடங்குகிறது.",
    h1: "சிலம்பப் பயிற்சியின் முதல் படிகள்",
    summary: "சமநிலை, பிரிவு நிலை, சாண் பிடி ஆகியவற்றிலிருந்து பயிற்சி தொடங்குகிறது."
  },
  "/blogs/three-level-syllabus": {
    title: "மூன்று நிலைகளில் ஒரு பயிற்சிப் பயணம் | Tenkasi District Sports Club",
    description: "ஆரம்பம், இடைநிலை, உயர்நிலை என மூன்று நிலைகளில் அமைந்த சிலம்பப் பாடத்திட்டம்.",
    h1: "மூன்று நிலைகளில் ஒரு பயிற்சிப் பயணம்",
    summary: "ஒவ்வொரு பயிற்சி நிலையும் முந்தைய திறன்களை வளர்க்கிறது."
  },
  "/blogs/guru-student-tradition": {
    title: "ஆசான் வழியில் தொடரும் கலை | Tenkasi District Sports Club",
    description: "சிவகலை குருகுலத்தின் ஆசான் வழிகாட்டலும் குரு மாணவர் மரபும்.",
    h1: "ஆசான் வழியில் தொடரும் கலை",
    summary: "குருகுல மரபில் பயிற்சியுடன் ஒழுக்கமும் பொறுப்பும் இணைகின்றன."
  },
  "/blogs/safe-practice": {
    title: "பாதுகாப்புடன் சிலம்பம் பயில்வது | Tenkasi District Sports Club",
    description: "சிலம்பப் பயிற்சியில் உடற்பயிற்சி, இடைவெளி மற்றும் ஆசான் மேற்பார்வையின் முக்கியத்துவம்.",
    h1: "பாதுகாப்புடன் சிலம்பம் பயில்வது",
    summary: "பாதுகாப்பான களப் பயிற்சியின் அடிப்படைப் பழக்கங்கள்."
  },
  "/blogs/training-ground-moments": {
    title: "களத்தில் உருவாகும் கற்றல் | Tenkasi District Sports Club",
    description: "சிவகலை குருகுலக் களத்தில் கவனம், மீண்டும் முயற்சி, கூட்டுப் பயிற்சி பற்றிய குறிப்புகள்.",
    h1: "களத்தில் உருவாகும் கற்றல்",
    summary: "ஒவ்வொரு பயிற்சியிலும் கற்றல் எப்படித் தொடர்கிறது."
  },
  "/students": {
    title: "மாணவர்கள் (Students) | Tenkasi District Sports Club",
    description: "சிவகலை குருகுல மாணவர்களுக்கான பாடத்திட்டம், சேர்க்கை மற்றும் மாணவர் போர்ட்டல் வழிகாட்டி.",
    h1: "மாணவர்கள்",
    summary: "பயிற்சி விவரங்கள், புதிய சேர்க்கை மற்றும் உறுப்பினர் அணுகல்."
  },
  "/alumni": {
    title: "முன்னாள் மாணவர்கள் (Alumni) | Tenkasi District Sports Club",
    description: "சிவகலை குருகுல முன்னாள் மாணவர்கள் தென்காசி மாவட்ட விளையாட்டுக் கழகத்துடன் தொடர்பில் இருக்க உதவும் பக்கம்.",
    h1: "முன்னாள் மாணவர்கள்",
    summary: "முன்னாள் மாணவர் தொடர்பு மற்றும் குருகுல நிகழ்வுகள்."
  },
  "/join": {
    title: "மாணவர் சேர்க்கை (Student Admission) | Tenkasi District Sports Club",
    description: "வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலத்தில் மாணவர் சேர்க்கை. சிலம்பம் மற்றும் பாரம்பரிய கலைப் பயிற்சிக்கான அதிகாரப்பூர்வ பதிவு.",
    h1: "மாணவர் சேர்க்கைப் படிவம்",
    summary: "புதிய மாணவர்களுக்கான சேர்க்கை பதிவு மற்றும் மாணவர் போர்ட்டல் கணக்கு உருவாக்கம்."
  },
  "/contact": {
    title: "தொடர்பு கொள்ள (Contact Us) | Tenkasi District Sports Club",
    description: "தென்காசி சிவகலை குருகுல தொடர்பு முகவரி, தொலைபேசி எண்கள் மற்றும் பொது விசாரணைப் படிவம்.",
    h1: "தொடர்பு முகவரி & விசாரணை",
    summary: "தென்காசி குருகுல நேரடி முகவரி, தொலைபேசி தொடர்பு மற்றும் பொதுக் கேள்விகளுக்கான தொடர்புப் படிவம்."
  },
  "/privacy": {
    title: "தனியுரிமைக் கொள்கை (Privacy Policy) | Tenkasi District Sports Club",
    description: "தென்காசி ஸ்போர்ட்ஸ் தனியுரிமைக் கொள்கை மற்றும் தகவல் பாதுகாப்பு நடைமுறைகள்.",
    h1: "தனியுரிமைக் கொள்கை",
    summary: "மாணவர்கள் மற்றும் பார்வையாளர்களின் தனிப்பட்ட தகவல் பாதுகாப்பு நெறிமுறைகள்."
  },
  "/terms": {
    title: "விதிமுறைகள் & நிபந்தனைகள் (Terms of Service) | Tenkasi District Sports Club",
    description: "தென்காசி சிவகலை குருகுல பயிற்சி மற்றும் சேர்க்கை விதிமுறைகள்.",
    h1: "பயிற்சி விதிமுறைகள் & நிபந்தனைகள்",
    summary: "குருகுல ஒழுங்குமுறை, பாதுகாப்புக் கோட்பாடுகள் மற்றும் பயிற்சி நெறிமுறைகள்."
  }
};

export const routeAliases = {
  "/programs": "/syllabus",
  "/silambam": "/syllabus",
  "/sports": "/syllabus",
  "/register": "/join"
};

export const notFoundMetadata = {
  title: "பக்கம் கிடைக்கவில்லை (Page Not Found - 404) | Tenkasi District Sports Club",
  description: "நீங்கள் தேடும் பக்கம் கிடைக்கவில்லை அல்லது முகவரி மாற்றப்பட்டுள்ளது.",
  h1: "பக்கம் கிடைக்கவில்லை (404 - Not Found)",
  summary: "நீங்கள் குறிப்பிட்ட முகவரியில் பக்கம் ஏதும் இல்லை. முகப்புப் பக்கத்திற்குத் திரும்பவும்."
};

export function liveHtml(response, row, path = "/", statusCode = 200) {
  if (!response || !response.headers.get("content-type")?.includes("text/html")) return response;
  const normalizedPath = routeAliases[path] || path;
  const isKnown = routeMetadata[normalizedPath] !== undefined;
  const meta = isKnown ? routeMetadata[normalizedPath] : notFoundMetadata;
  const status = isKnown ? statusCode : 404;

  const publication = row ? JSON.parse(row.payload_json) : null;
  const title = meta.title;
  const description = meta.description;
  const serialized = publication ? JSON.stringify(publication).replaceAll("<", "\\u003c") : "";

  if (typeof HTMLRewriter === "undefined") {
    const result = new Response(response.body, {
      status,
      statusText: status === 404 ? "Not Found" : "OK",
      headers: new Headers(response.headers)
    });
    result.headers.set("Cache-Control", "no-store");
    if (row) result.headers.set("X-Codexsun-Publication", String(row.version));
    return result;
  }

  let rewrite = new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(title);
      }
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", description);
      }
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute("content", title);
      }
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute("content", description);
      }
    })
    .on("script#codexsun-sites-publication", {
      element(element) {
        if (serialized) element.setInnerContent(serialized, { html: true });
      }
    })
    .on("head", {
      element(element) {
        element.append(
          `<meta property="og:url" content="https://tenkasisports.com${path === "/" ? "" : path}">` +
            `<meta property="og:type" content="website">` +
            `<meta property="og:site_name" content="Tenkasi District Sports Club">` +
            `<link rel="canonical" href="https://tenkasisports.com${path === "/" ? "" : path}">`,
          { html: true }
        );
        if (serialized) {
          element.append(
            `<script id="codexsun-sites-publication" type="application/json">${serialized}</script>`,
            { html: true }
          );
        }
      }
    });

  const transformed = rewrite.transform(response);
  const result = new Response(transformed.body, {
    status,
    statusText: status === 404 ? "Not Found" : (status === 200 ? "OK" : transformed.statusText),
    headers: new Headers(transformed.headers)
  });
  result.headers.set("Cache-Control", "no-store");
  if (row) result.headers.set("X-Codexsun-Publication", String(row.version));
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
