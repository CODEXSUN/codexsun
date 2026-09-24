const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const test = require('node:test');

function setup(settings = {}) {
  const opened = [];
  const module = { exports: {} };
  const vscode = {
    workspace: { getConfiguration: () => ({ get: (key) => settings[key] }) },
    Uri: { parse: (url) => url },
    env: { openExternal: async (url) => { opened.push(url); return true; } },
  };
  runInNewContext(readFileSync(join(__dirname, '../src/zbrowser.js'), 'utf8'), {
    module, process: { env: {} },
    require: (name) => name === 'vscode' ? vscode : name.startsWith('./') ? require(`../src/${name.slice(2)}`) : require(name),
  });
  const view = new module.exports.ZbrowserView();
  view.setTargets([{ id: 'crm', state: 'ready', port: 6140, apiPort: 6204, webPort: 6205 }]);
  return { view, opened };
}

test('Open and all port badges use the tmnext domain without environment setup', async () => {
  const { view, opened } = setup();
  await view.handleMessage({ type: 'open', id: 'crm' });
  for (const kind of ['api', 'web', 'zbrowser']) await view.handleMessage({ type: 'open-port', id: 'crm', kind });
  assert.deepEqual(opened, ['https://6140.tmnext.in/', 'https://6204.tmnext.in/', 'https://6205.tmnext.in/', 'https://6140.tmnext.in/']);
});

test('port clicks cannot supply arbitrary destinations or open stopped previews', async () => {
  const { view, opened } = setup();
  await view.handleMessage({ type: 'open-port', id: 'unknown', kind: 'api' });
  await view.handleMessage({ type: 'open-port', id: 'crm', kind: '__proto__', port: 9999 });
  view.targets.get('crm').state = 'stopped';
  await view.handleMessage({ type: 'open-port', id: 'crm', kind: 'zbrowser' });
  assert.deepEqual(opened, []);
  await view.handleMessage({ type: 'open-port', id: 'crm', kind: 'api', port: 9999 });
  assert.equal(opened[0], 'https://6204.tmnext.in/');
});

test('explicit template supports local development', async () => {
  const { view, opened } = setup({ previewUrlTemplate: 'http://127.0.0.1:{port}/' });
  await view.handleMessage({ type: 'open', id: 'crm' });
  assert.deepEqual(opened, ['http://127.0.0.1:6140/']);
});
