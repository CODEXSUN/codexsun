import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { CodexRuntime } from "./codex-runtime.mjs";
import { renderConsolePage } from "./console-page.mjs";

const config = readConfig(process.env);
const runtime = new CodexRuntime();
const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/" && request.method === "GET") return runtime.status().then((connection) => sendHtml(response, connection)).catch(() => sendHtml(response, { connected: false, message: "Codex status is unavailable." }));
  if (url.pathname === "/health" && request.method === "GET") return sendJson(response, 200, { status: "ok" });
  if (url.pathname === "/console/connect/status" && request.method === "GET") return consoleConnection(response, () => runtime.status());
  if (url.pathname === "/console/connect/device-code" && request.method === "POST") return consoleConnection(response, () => runtime.startDeviceCode());
  if (url.pathname === "/console/connect/signout" && request.method === "POST") return consoleConnection(response, () => runtime.signOut());
  if (!authorized(request.headers["x-zxa-control-key"], config.controlKey)) return sendJson(response, 401, { error: "ZXA authentication failed." });
  try {
    if (url.pathname === "/connect/status" && request.method === "GET") return sendJson(response, 200, await runtime.status());
    if (url.pathname === "/connect/device-code" && request.method === "POST") return sendJson(response, 200, await runtime.startDeviceCode());
    return sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    return sendJson(response, 503, { error: error instanceof Error ? error.message : "Codex is unavailable." });
  }
});
server.listen(config.port, config.host, () => {
  console.log(`ZXA listening at http://${config.host}:${config.port}`);
  void keepRegistered(config);
});

function readConfig(environment) {
  const agentId = environment.ZXA_AGENT_ID;
  const zunoApiUrl = origin(environment.ZXA_ZUNO_API_URL);
  const bootstrapKey = environment.ZXA_ZUNO_BOOTSTRAP_KEY;
  const controlKey = environment.ZXA_CONTROL_KEY;
  const apiUrl = origin(environment.ZXA_PUBLIC_URL);
  if (!agentId || !zunoApiUrl || !bootstrapKey || bootstrapKey.length < 32 || !controlKey || controlKey.length < 32 || !apiUrl) throw new Error("Set the ZXA agent, Zuno, public URL, and 32-character control keys.");
  const port = Number(environment.ZXA_PORT || 7210);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ZXA_PORT to a valid port.");
  return { agentId, apiUrl, bootstrapKey, controlKey, host: environment.ZXA_HOST || "0.0.0.0", port, zunoApiUrl };
}

async function keepRegistered(config) {
  for (;;) {
    try {
      await registerWithZuno(config);
      return;
    } catch (error) {
      console.error(error instanceof Error ? error.message : "ZXA registration failed.");
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

async function registerWithZuno(config) {
  const response = await fetch(`${config.zunoApiUrl}/api/v1/zuno/agents/register`, {
    body: JSON.stringify({ apiUrl: config.apiUrl, capacity: 1, id: config.agentId, name: "ZXA", protocolVersion: 1 }),
    headers: { "Content-Type": "application/json", "X-ZXA-Bootstrap-Key": config.bootstrapKey }, method: "POST",
  });
  if (!response.ok) throw new Error(`ZXA could not register with Zuno (${response.status}).`);
}

function authorized(value, expected) {
  if (typeof value !== "string") return false;
  const supplied = Buffer.from(value);
  const secret = Buffer.from(expected);
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

function origin(value) { try { return new URL(value || "").origin; } catch { return undefined; } }
function sendJson(response, status, value) { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(value)); }
function sendHtml(response, connection) { response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); response.end(renderConsolePage(connection)); }
async function consoleConnection(response, work) { try { return sendJson(response, 200, await work()); } catch (error) { return sendJson(response, 503, { error: error instanceof Error ? error.message : "Codex is unavailable." }); } }
function consolePage() { return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZXA Codex</title><style>body{font:16px system-ui;margin:40px;max-width:680px;color:#15211c;background:#fff}main{display:grid;gap:22px}h1,p{margin:0}h1{font-size:26px}.header{display:flex;align-items:start;justify-content:space-between;gap:16px}.muted{color:#54645a}.field{display:grid;gap:7px}.row{display:flex;flex-wrap:wrap;gap:9px;align-items:center}button{font:inherit;padding:9px 11px;border:1px solid #163d28;border-radius:4px;cursor:pointer;background:#163d28;color:#fff}button.secondary{background:#fff;color:#163d28}button:disabled{opacity:.55;cursor:not-allowed}.code{font:600 22px ui-monospace,monospace;letter-spacing:1px;background:#eef3ef;padding:12px 14px;min-width:190px;text-align:center}.status{padding:12px 0;border-top:1px solid #dce5df;color:#54645a}.indicator{width:16px;height:16px;border:3px solid #c18c00;border-radius:50%;flex:0 0 auto}.indicator.connected{border-color:#17803d}.indicator.failed{border-color:#b42318}a{color:#0e5532}</style></head><body><main><header class="header"><div><h1>Connect Codex</h1><p class="muted">ZXA local operator console</p></div><span id="indicator" class="indicator" role="status" aria-label="Codex connection status"></span></header><section class="field"><strong>OpenAI device login</strong><a id="login-link" href="https://auth.openai.com/codex/device" target="_blank" rel="noreferrer">https://auth.openai.com/codex/device</a><div class="row"><button id="connect" type="button">Generate device code</button><button id="status" class="secondary" type="button">Refresh status</button></div></section><section id="code-panel" class="field"><span class="muted">One-time device code</span><div class="row"><code id="code" class="code">Waiting for code</code><button id="copy" class="secondary" type="button" disabled>Copy code</button></div></section><p id="status-text" class="status" aria-live="polite">Checking Codex connection.</p></main><script>const link=document.querySelector('#login-link'),connect=document.querySelector('#connect'),status=document.querySelector('#status'),panel=document.querySelector('#code-panel'),code=document.querySelector('#code'),copy=document.querySelector('#copy'),text=document.querySelector('#status-text'),indicator=document.querySelector('#indicator');function state(kind,message){indicator.className='indicator '+kind;indicator.setAttribute('aria-label',message);text.textContent=message}function hideCode(){panel.hidden=true;copy.disabled=true}function showCode(value){panel.hidden=false;code.textContent=value;copy.disabled=false}async function call(path,method='GET'){connect.disabled=true;try{const r=await fetch(path,{method});const b=await r.json();if(!r.ok)throw new Error(b.error||'ZXA request failed.');if(b.connected){hideCode();state('connected','Device connected')}else if(b.userCode){showCode(b.userCode);if(b.verificationUrl)link.href=b.verificationUrl;state('waiting','Waiting for device login')}else{hideCode();state('waiting',b.message||'Device not connected')}catch(error){hideCode();state('failed',error instanceof Error?error.message:'ZXA request failed.')}finally{connect.disabled=false}}status.onclick=()=>call('/console/connect/status');connect.onclick=()=>call('/console/connect/device-code','POST');copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.textContent||'');text.textContent='Device code copied to clipboard.'}catch{text.textContent='Browser could not copy the device code.'}};call('/console/connect/status')</script></body></html>`; }
