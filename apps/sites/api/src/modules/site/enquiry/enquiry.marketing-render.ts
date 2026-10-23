import { z } from "zod";

const definitionSchema = z.object({
  success: z.literal(true),
  data: z.object({
    title: z.string().max(160),
    consentNotice: z.string().max(2000),
    noticeVersion: z.string().max(40),
    expiresAt: z.iso.datetime()
  })
});
const inputSchema = z
  .strictObject({
    sourceKey: z.string().min(8).max(191),
    name: z.string().trim().min(1).max(160),
    email: z.union([z.literal(""), z.email().max(254)]),
    phone: z.string().trim().max(40),
    message: z.string().max(10000),
    privacyConsent: z.literal(true),
    website: z.literal("")
  })
  .refine(
    (value) => Boolean(value.email || value.phone),
    "Enter an email address or phone number."
  );

export function approvedCaptureUrl(destination: string) {
  const url = new URL(destination);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["codexsun.com", "app.codexsun.com"].includes(url.hostname) ||
    !/^\/api\/(?:platform|app)\/public\/marketing\/captures$/.test(url.pathname) ||
    !/^[A-Za-z0-9_.-]{40,2000}$/.test(url.searchParams.get("token") ?? "")
  )
    throw new Error("Use the approved CODEXSUN public capture URL.");
  return url;
}

/** Sites renders the form. Only Marketing accepts and stores these new capture submissions. */
export async function marketingCaptureResponse(
  request: Request,
  destination: string,
  origin: string,
  send: typeof fetch = fetch
) {
  const url = new URL(request.url);
  if (url.origin !== origin) return response("Unrecognized website host.", 421, "text/plain");
  if (!destination) return response("Capture is not configured.", 404, "text/plain");
  const target = approvedCaptureUrl(destination);
  if (url.pathname === "/content/v1/marketing-capture.js" && request.method === "GET")
    return response(script, 200, "text/javascript");
  if (url.pathname === "/marketing/capture" && request.method === "GET") {
    const result = await send(target, { signal: AbortSignal.timeout(10000), redirect: "error" });
    if (!result.ok)
      return response(
        "This capture form is unavailable. Please contact the website owner.",
        503,
        "text/plain"
      );
    const definition = definitionSchema.parse(await boundedJson(result));
    return response(render(definition.data), 200, "text/html; charset=utf-8");
  }
  if (url.pathname !== "/content/v1/marketing-capture" || request.method !== "POST")
    return response("Method not allowed.", 405, "text/plain");
  if (request.headers.get("origin") !== origin)
    return response("This website origin is not approved.", 403, "text/plain");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return response("Use a JSON request.", 415, "text/plain");
  const parsed = inputSchema.safeParse(await boundedJson(request));
  if (!parsed.success)
    return response(
      JSON.stringify({
        success: false,
        error: { message: "Check the required fields and consent." }
      }),
      400,
      "application/json"
    );
  const result = await send(target, {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    redirect: "error",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(parsed.data)
  });
  if (!result.ok)
    return response(
      JSON.stringify({
        success: false,
        error: { message: "Your enquiry could not be saved. Please retry." }
      }),
      503,
      "application/json"
    );
  const receipt = z
    .object({
      success: z.literal(true),
      data: z.object({ reference: z.string().regex(/^[a-f0-9]{8}$/), received: z.literal(true) })
    })
    .parse(await boundedJson(result));
  return response(JSON.stringify(receipt), 200, "application/json");
}

async function boundedJson(source: Request | Response) {
  const reader = source.body?.getReader();
  if (!reader) throw new Error("Missing request or response body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw Object.assign(new Error("The capture payload is too large."), { status: 413 });
    }
    chunks.push(value);
  }
  const content = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(content));
  } catch {
    throw Object.assign(new Error("Invalid capture JSON."), { status: 400 });
  }
}
function response(body: string, status: number, type: string) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
    }
  });
}
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
  );
}
function render(definition: z.infer<typeof definitionSchema>["data"]) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(definition.title)}</title><style>body{font:16px system-ui;margin:2rem auto;padding:1rem;max-width:36rem;color:#172033}label{display:block;margin:1rem 0}input,textarea,button{font:inherit;padding:.65rem;box-sizing:border-box}input:not([type=checkbox]),textarea{width:100%;border:1px solid #cbd5e1;border-radius:.35rem}button{cursor:pointer}button:disabled{cursor:not-allowed}.trap{display:none}#result{white-space:pre-line}</style></head><body><main><h1>${escape(definition.title)}</h1><form><label>Name *<input name="name" required maxlength="160" autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="254" autocomplete="email"></label><label>Phone<input name="phone" maxlength="40" autocomplete="tel"></label><label>Message<textarea name="message" maxlength="10000"></textarea></label><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label><input type="checkbox" name="privacyConsent" required> ${escape(definition.consentNotice)}</label><p>Notice version: ${escape(definition.noticeVersion)}. This form does not subscribe you to promotional messages.</p><button type="submit">Send enquiry</button></form><p id="result" role="status"></p></main><script src="/content/v1/marketing-capture.js" defer></script></body></html>`;
}
const script = `const form=document.querySelector('form'),result=document.querySelector('#result');let key=crypto.randomUUID();form.addEventListener('input',()=>{key=crypto.randomUUID();});form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;result.textContent='Saving enquiry…';const data=new FormData(form);const payload={sourceKey:key,name:String(data.get('name')||''),email:String(data.get('email')||''),phone:String(data.get('phone')||''),message:String(data.get('message')||''),privacyConsent:data.get('privacyConsent')==='on',website:String(data.get('website')||'')};try{const response=await fetch('/content/v1/marketing-capture',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok||!body.success)throw new Error(body.error?.message||'Your enquiry could not be saved. Please retry.');result.textContent='Your enquiry was received. Reference: '+body.data.reference;form.reset();key=crypto.randomUUID();}catch(error){result.textContent=error.message||'Your enquiry could not be saved. Please retry.';}finally{button.disabled=false;}});`;
