const { randomBytes } = require('node:crypto');
const vscode = require('vscode');
const { zbrowserHtml } = require('./zbrowser-page');

const MANAGER_URL = process.env.ZBROWSER_MANAGER_URL ?? 'http://zbrowser:3001';

class ZbrowserView {
  constructor() {
    this.targets = new Map();
    this.busy = new Set();
    this.notice = '';
  }

  resolveWebviewView(view) {
    clearInterval(this.timer);
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = zbrowserHtml(randomBytes(16).toString('hex'));
    view.webview.onDidReceiveMessage((message) => this.handleMessage(message));
    view.onDidChangeVisibility(() => this.refresh());
    view.onDidDispose(() => {
      clearInterval(this.timer);
      this.view = undefined;
    });
    this.timer = setInterval(() => this.refresh(), 5000);
    this.refresh();
  }

  dispose() {
    clearInterval(this.timer);
  }

  async handleMessage(message) {
    if (message?.type === 'refresh') return this.refresh();
    if (typeof message?.id !== 'string') return;
    const target = this.targets.get(message.id);
    if (!target || this.busy.has(target.id)) return;

    if (message.type === 'open' && target.state === 'ready') {
      await vscode.env.openExternal(vscode.Uri.parse(`http://127.0.0.1:${target.port}/`));
      return;
    }
    if (message.type !== 'start' && message.type !== 'stop') return;
    this.busy.add(target.id);
    this.publish();
    try {
      const response = await fetch(`${MANAGER_URL}/targets/${target.id}/${message.type}`, {
        method: 'POST', signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Preview action failed.');
      this.setTargets(data.targets);
      this.notice = '';
    } catch (error) {
      this.notice = error.message;
    } finally {
      this.busy.delete(target.id);
      this.publish();
    }
  }

  async refresh() {
    if (!this.view?.visible) return;
    try {
      const response = await fetch(`${MANAGER_URL}/targets`, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error('Zbrowser service is unavailable.');
      this.setTargets((await response.json()).targets);
      this.notice = '';
    } catch {
      this.notice = 'Zbrowser service is unavailable.';
    }
    this.publish();
  }

  setTargets(targets) {
    if (!Array.isArray(targets)) throw new Error('Invalid Zbrowser response.');
    this.targets = new Map(targets.map((target) => [target.id, target]));
  }

  publish() {
    this.view?.webview.postMessage({
      type: 'state',
      targets: [...this.targets.values()].map((target) => ({ ...target, busy: this.busy.has(target.id) })),
      notice: this.notice,
    });
  }
}

module.exports = { ZbrowserView };
