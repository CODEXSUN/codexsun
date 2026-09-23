export function renderConsolePage(connection) {
  const initial = JSON.stringify(connection).replace(/</g, "\\u003c");
  const connected = connection.connected === true;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ZXA Agent</title>
  <style>
    body{margin:0;background:#f5f7f6;color:#17221c;font:15px system-ui}.shell{max-width:860px;margin:0 auto;padding:48px 24px}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid #d8e0da;padding-bottom:24px}.eyebrow{color:#5d6e63;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.name{margin:5px 0 0;font-size:30px}.health{display:flex;align-items:center;gap:8px;font-weight:600}.dot{width:11px;height:11px;border-radius:50%;background:#c18c00}.dot.connected{background:#198344}.dot.failed{background:#b42318}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#d8e0da;border:1px solid #d8e0da;margin-top:24px}.panel{background:#fff;padding:22px}.label{color:#5d6e63;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.value{margin-top:8px;font-size:17px;overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}button{font:inherit;padding:10px 13px;border:1px solid #1b5638;border-radius:4px;background:#1b5638;color:#fff;cursor:pointer}button.secondary{background:#fff;color:#1b5638}button.danger{background:#fff;color:#a41d18;border-color:#a41d18}button:disabled{opacity:.55;cursor:not-allowed}.device{margin-top:24px;border-top:1px solid #d8e0da;padding-top:24px}.device[hidden]{display:none}.code{font:600 23px ui-monospace,monospace;letter-spacing:1px;background:#eaf1ec;padding:12px 14px;display:inline-block}.message{margin-top:18px;color:#5d6e63}.message.failed{color:#b42318}a{color:#075b34}@media(max-width:620px){.shell{padding:28px 16px}.top{display:grid}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="top"><div><div class="eyebrow">Cloud agent runtime</div><h1 class="name">ZXA</h1></div><div class="health"><span id="dot" class="dot"></span><span id="health">Checking connection</span></div></header>
    <section class="grid"><div class="panel"><div class="label">Connected account</div><div id="email" class="value">Not connected</div></div><div class="panel"><div class="label">Authentication</div><div id="auth" class="value">ChatGPT device login</div></div><div class="panel"><div class="label">Codex CLI</div><div id="cli" class="value">Checking</div></div><div class="panel"><div class="label">Agent endpoint</div><div class="value">Local loopback</div></div></section>
    <section class="actions"><button id="connect" type="button">Generate device code</button><button id="refresh" class="secondary" type="button">Refresh status</button><button id="signout" class="danger" type="button" ${connected ? "" : "hidden"}>Sign out</button><a href="https://auth.openai.com/codex/device" target="_blank" rel="noreferrer">Open OpenAI device login</a></section>
    <section id="device" class="device" hidden><div class="label">One-time device code</div><div class="actions"><code id="code" class="code"></code><button id="copy" class="secondary" type="button">Copy code</button></div></section>
    <p id="message" class="message" aria-live="polite"></p>
  </main>
  <script>
    const initial=${initial};
    const dot=document.querySelector('#dot'),health=document.querySelector('#health'),email=document.querySelector('#email'),auth=document.querySelector('#auth'),cli=document.querySelector('#cli'),device=document.querySelector('#device'),code=document.querySelector('#code'),message=document.querySelector('#message'),connect=document.querySelector('#connect'),signout=document.querySelector('#signout');
    let pollTimer;
    let requestInFlight=false;

    function stopPolling(){if(pollTimer){window.clearInterval(pollTimer);pollTimer=undefined}}
    function startPolling(){stopPolling();pollTimer=window.setInterval(()=>void request('/console/connect/status','GET',true),3000)}
    function show(state){const connected=state.connected===true;dot.className='dot '+(connected?'connected':'');health.textContent=connected?'Device connected':'Device not connected';email.textContent=state.account?.email||'Not connected';auth.textContent=state.account?.planType?('ChatGPT '+state.account.planType):'ChatGPT device login';cli.textContent=state.cli||'Unavailable';signout.hidden=!connected;message.textContent=connected?'Device connected':(state.message||'Device not connected');message.className='message';if(connected)stopPolling()}

    async function request(path,method='GET',silent=false){
      if(requestInFlight)return;
      requestInFlight=true;
      if(!silent){connect.disabled=true;signout.disabled=true}
      try{
        const response=await fetch(path,{method});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||'ZXA request failed.');
        if(result.userCode){code.textContent=result.userCode;device.hidden=false;health.textContent='Waiting for device login';dot.className='dot';message.textContent=result.message;startPolling()}else{device.hidden=true;show(result)}
      }catch(error){
        if(!silent){device.hidden=true;dot.className='dot failed';health.textContent='Connection error';message.className='message failed';message.textContent=error instanceof Error?error.message:'ZXA request failed.';stopPolling()}
      }finally{requestInFlight=false;if(!silent){connect.disabled=false;signout.disabled=false}}
    }

    document.querySelector('#refresh').onclick=()=>request('/console/connect/status');
    connect.onclick=()=>request('/console/connect/device-code','POST');
    signout.onclick=()=>request('/console/connect/signout','POST');
    document.querySelector('#copy').onclick=()=>navigator.clipboard.writeText(code.textContent||'').then(()=>message.textContent='Device code copied to clipboard.').catch(()=>message.textContent='Browser could not copy the device code.');
    show(initial);
  </script>
</body>
</html>`;
}
