function pageHtml(nonce) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Codexsun OS</title>
  <style nonce="${nonce}">
    * { box-sizing: border-box; }
    body { margin: 0; padding: 18px 14px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); font: 13px/1.45 var(--vscode-font-family); }
    header { padding: 0 0 20px; border-bottom: 1px solid var(--vscode-panel-border); }
    .eyebrow { color: var(--vscode-descriptionForeground); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 3px 0 0; font-size: 19px; font-weight: 650; }
    h2 { margin: 20px 0 8px; font-size: 11px; text-transform: uppercase; color: var(--vscode-descriptionForeground); }
    .addon { display: flex; align-items: center; gap: 8px; min-height: 60px; padding: 10px 0; border-bottom: 1px solid var(--vscode-panel-border); }
    .details { min-width: 0; flex: 1; }
    .name { font-size: 13px; font-weight: 600; }
    .meta { display: flex; align-items: center; gap: 5px; color: var(--vscode-descriptionForeground); font-size: 12px; }
    .dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--vscode-descriptionForeground); }
    .dot.ok { background: var(--vscode-testing-iconPassed, #298a47); }
    button { min-height: 28px; padding: 3px 9px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); font: inherit; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button:disabled { opacity: .55; cursor: default; }
    button.secondary { color: var(--vscode-foreground); background: transparent; border-color: var(--vscode-panel-border); }
    button.secondary:hover { background: var(--vscode-list-hoverBackground); }
    .runtime { display: grid; grid-template-columns: 82px 1fr; gap: 7px; font-size: 12px; }
    .runtime dt { color: var(--vscode-descriptionForeground); }
    .runtime dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
    #notice { min-height: 22px; color: var(--vscode-descriptionForeground); font-size: 12px; }
    @media (max-width: 260px) { .addon { flex-wrap: wrap; } .addon button { margin-left: auto; } }
  </style>
</head>
<body>
  <header><div class="eyebrow">Workspace tools</div><h1>Codexsun OS</h1></header>
  <section aria-labelledby="addons-title"><h2 id="addons-title">Add-ons</h2><div id="addons"></div></section>
  <section aria-labelledby="runtime-title"><h2 id="runtime-title">Workspace</h2><dl class="runtime"><dt>Repository</dt><dd id="workspace"></dd><dt>Node</dt><dd id="node"></dd></dl></section>
  <p id="notice" role="status" aria-live="polite"></p>
  <script nonce="${nonce}">
    const api = acquireVsCodeApi();
    const list = document.getElementById('addons');
    document.body.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if (action) api.postMessage({ type: action.dataset.action, id: action.dataset.id });
    });
    window.addEventListener('message', ({ data }) => {
      if (data.type !== 'state') return;
      list.replaceChildren();
      for (const addon of data.addons) {
        const row = document.createElement('div');
        row.className = 'addon';
        const details = document.createElement('div');
        details.className = 'details';
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = addon.name;
        const meta = document.createElement('div');
        meta.className = 'meta';
        const dot = document.createElement('span');
        dot.className = addon.installed ? 'dot ok' : 'dot';
        const status = document.createElement('span');
        status.textContent = addon.busy ? 'Working' : addon.installed ? 'Installed' : addon.detail;
        meta.append(dot, status);
        details.append(name, meta);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = addon.installed ? 'secondary' : '';
        button.dataset.action = addon.installed ? 'remove' : 'install';
        button.dataset.id = addon.id;
        button.textContent = addon.busy ? 'Wait' : addon.installed ? 'Remove' : 'Install';
        button.disabled = addon.busy;
        row.append(details, button);
        list.append(row);
      }
      document.getElementById('workspace').textContent = data.workspace;
      document.getElementById('node').textContent = data.node;
      document.getElementById('notice').textContent = data.notice;
    });
    api.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

module.exports = { pageHtml };
