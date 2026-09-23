const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');
const vscode = require('vscode');
const { ADDONS, getAddon } = require('./catalog');
const { pageHtml } = require('./page');
const { ZbrowserView } = require('./zbrowser');

class AddonsView {
  constructor() {
    this.busy = new Set();
    this.notice = '';
    this.ideInstalled = undefined;
    this.extensionChange = vscode.extensions.onDidChange(() => this.publish());
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = pageHtml(randomBytes(16).toString('hex'));
    view.webview.onDidReceiveMessage((message) => this.handleMessage(message));
    view.onDidDispose(() => { this.view = undefined; });
  }

  dispose() {
    this.extensionChange.dispose();
  }

  async handleMessage(message) {
    if (message?.type === 'ready' || message?.type === 'refresh') {
      this.publish();
      return;
    }

    if (message?.type !== 'install' && message?.type !== 'remove') return;
    const addon = getAddon(message.id);
    if (!addon || this.busy.has(addon.id)) return;

    if (message.type === 'remove') {
      const answer = await vscode.window.showWarningMessage(
        `Remove ${addon.name} from this editor?`, { modal: true }, 'Remove',
      );
      if (answer !== 'Remove') return;
    }

    this.busy.add(addon.id);
    this.notice = '';
    this.publish();
    try {
      if (addon.extensionId) {
        const command = message.type === 'install'
          ? 'workbench.extensions.installExtension'
          : 'workbench.extensions.uninstallExtension';
        await vscode.commands.executeCommand(command, addon.extensionId);
        this.ideInstalled = message.type === 'install';
      } else {
        await runNpm(addon, message.type);
      }
      this.notice = `${addon.name} ${message.type === 'install' ? 'installed' : 'removed'}.`;
    } catch (error) {
      this.notice = `${addon.name}: ${error.message}`;
    } finally {
      this.busy.delete(addon.id);
      this.publish();
    }
  }

  publish() {
    if (!this.view) return;
    const cliPath = join(homedir(), '.local', 'bin', 'codex');
    const addons = Object.values(ADDONS).map((addon) => ({
      id: addon.id,
      name: addon.name,
      detail: addon.detail,
      installed: addon.extensionId
        ? this.ideInstalled ?? Boolean(vscode.extensions.getExtension(addon.extensionId))
        : existsSync(cliPath),
      busy: this.busy.has(addon.id),
    }));
    this.view.webview.postMessage({
      type: 'state',
      addons,
      notice: this.notice,
      node: process.version,
      workspace: vscode.workspace.workspaceFolders?.[0]?.name ?? 'No workspace',
    });
  }
}

function runNpm(addon, action) {
  const prefix = join(homedir(), '.local');
  const packageSpec = action === 'install'
    ? `${addon.packageName}@${addon.packageVersion}`
    : addon.packageName;
  const args = [action === 'install' ? 'install' : 'uninstall', '--global',
    '--prefix', prefix, packageSpec, '--no-audit', '--no-fund'];

  return new Promise((resolve, reject) => {
    const child = spawn('npm', args, { stdio: 'ignore', shell: false });
    const timeout = setTimeout(() => child.kill(), 180000);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`package install exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function activate(context) {
  const view = new AddonsView();
  const zbrowser = new ZbrowserView();
  const brand = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
  brand.name = 'Codexsun Zcode';
  brand.text = 'Codexsun Zcode';
  brand.tooltip = 'Think. Build. Deploy.';
  brand.show();
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(
    'codexsunOs.addons', view,
  ), vscode.window.registerWebviewViewProvider(
    'codexsunOs.zbrowser', zbrowser,
  ), view, zbrowser, brand);

  await vscode.workspace.getConfiguration('workbench').update(
    'startupEditor', 'none', vscode.ConfigurationTarget.Global,
  );
  for (const group of vscode.window.tabGroups.all) {
    const welcome = group.tabs.find((tab) => tab.label === 'Welcome' &&
      !(tab.input instanceof vscode.TabInputText));
    if (welcome) await vscode.window.tabGroups.close(welcome);
  }
}

module.exports = { activate };
