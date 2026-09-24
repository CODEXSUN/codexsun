function zbrowserHtml(nonce) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Zbrowser</title>
  <style nonce="${nonce}">
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px 12px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); font: 13px/1.4 var(--vscode-font-family); }
    header { padding: 0 2px 14px; border-bottom: 1px solid var(--vscode-panel-border); }
    .eyebrow { color: var(--vscode-descriptionForeground); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 3px 0 0; font-size: 19px; font-weight: 650; }
    h2 { margin: 18px 2px 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--vscode-descriptionForeground); }
    .item { padding: 12px; margin: 8px 0; border: 1px solid var(--vscode-panel-border, #8886); border-radius: 6px; }
    .item-head { display: flex; align-items: baseline; gap: 7px; }
    .name { min-width: 0; flex: 1; font-weight: 600; overflow-wrap: anywhere; }
    .port { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .ports { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    button.port-link { display: inline-flex; align-items: center; gap: 6px; padding: 3px 7px; font-size: 11px; color: var(--vscode-textLink-foreground); background: transparent; border: 1px solid var(--vscode-panel-border, #8886); }
    button.port-link:hover:not(:disabled) { background: var(--vscode-list-hoverBackground); border-color: var(--vscode-focusBorder); }
    button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    .port-label { color: var(--vscode-descriptionForeground); }
    .port-number { font-weight: 600; font-variant-numeric: tabular-nums; }
    .meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; color: var(--vscode-descriptionForeground); font-size: 12px; }
    .dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--vscode-descriptionForeground); }
    .dot.ready { background: var(--vscode-testing-iconPassed, #298a47); }
    .dot.starting { background: var(--vscode-editorWarning-foreground, #b88a24); }
    .dot.error { background: var(--vscode-testing-iconFailed, #bd4c41); }
    .actions { display: flex; gap: 6px; margin-top: 8px; }
    button { min-height: 27px; padding: 3px 9px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); font: inherit; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button:disabled { opacity: .55; cursor: default; }
    button.secondary { color: var(--vscode-foreground); background: transparent; border-color: var(--vscode-panel-border); }
    button.secondary:hover { background: var(--vscode-list-hoverBackground); }
    #notice { min-height: 20px; margin: 12px 2px; color: var(--vscode-editorWarning-foreground, #b88a24); font-size: 12px; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <header><div class="eyebrow">Workspace previews</div><h1>Zbrowser</h1></header>
  <div id="groups"></div>
  <p id="notice" role="status" aria-live="polite"></p>
  <script nonce="${nonce}">
    const api = acquireVsCodeApi();
    const groups = document.getElementById('groups');
    document.body.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (button && !button.disabled) api.postMessage({ type: button.dataset.action, id: button.dataset.id, kind: button.dataset.kind });
    });
    window.addEventListener('message', ({ data }) => {
      if (data.type !== 'state') return;
      groups.replaceChildren();
      for (const [group, title] of [['apps', 'Apps'], ['devkits', 'Devkits']]) {
        const section = document.createElement('section');
        section.setAttribute('aria-label', title);
        const heading = document.createElement('h2');
        heading.textContent = title;
        section.append(heading);
        for (const target of data.targets.filter((item) => item.group === group)) {
          const row = document.createElement('div');
          row.className = 'item';
          const head = document.createElement('div');
          head.className = 'item-head';
          const name = document.createElement('span');
          name.className = 'name';
          name.textContent = target.label;
          head.append(name);
          const meta = document.createElement('div');
          meta.className = 'meta';
          const dot = document.createElement('span');
          dot.className = 'dot ' + target.state;
          const status = document.createElement('span');
          status.textContent = target.error || ({ ready: 'Live', starting: 'Starting', stopped: 'Stopped', unavailable: 'No web preview', error: 'Failed' }[target.state] ?? 'Unknown');
          meta.append(dot, status);
          row.append(head, meta);
          const ports = document.createElement('div');
          ports.className = 'ports';
          ports.setAttribute('aria-label', 'Configured service ports');
          for (const [kind, label, value] of [['api', 'API', target.apiPort], ['web', 'Web', target.webPort], ['zbrowser', 'Zbrowser', target.zbrowserPort ?? target.port]]) {
            const badge = actionButton('', 'open-port', target);
            badge.className = 'port-link';
            badge.dataset.kind = kind;
            badge.disabled = target.busy || !value || (kind === 'zbrowser' && target.state !== 'ready');
            const caption = document.createElement('span');
            caption.className = 'port-label';
            caption.textContent = label;
            const number = document.createElement('span');
            number.className = 'port-number';
            number.textContent = value || '—';
            badge.replaceChildren(caption, number);
            badge.title = !value ? label + ' port not configured' : kind === 'zbrowser' ? 'Open preview on port ' + value : 'Open configured ' + label + ' port ' + value + ' (service status not checked)';
            badge.setAttribute('aria-label', badge.title);
            ports.append(badge);
          }
          row.append(ports);
          if (target.port) {
            const actions = document.createElement('div');
            actions.className = 'actions';
            if (target.state === 'stopped' || target.state === 'error') {
              actions.append(actionButton('Start', 'start', target));
            } else {
              const open = actionButton('Open', 'open', target);
              open.disabled = target.state !== 'ready' || target.busy;
              actions.append(open, actionButton('Stop', 'stop', target, true));
            }
            row.append(actions);
          }
          section.append(row);
        }
        groups.append(section);
      }
      document.getElementById('notice').textContent = data.notice;
    });
    function actionButton(label, action, target, secondary = false) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = target.busy ? 'Wait' : label;
      button.dataset.action = action;
      button.dataset.id = target.id;
      button.disabled = target.busy;
      if (secondary) button.className = 'secondary';
      return button;
    }
    api.postMessage({ type: 'refresh' });
  </script>
</body>
</html>`;
}

module.exports = { zbrowserHtml };
