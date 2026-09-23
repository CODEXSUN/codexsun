const assert = require('node:assert/strict');
const test = require('node:test');
const { ADDONS, getAddon } = require('../src/catalog');
const { pageHtml } = require('../src/page');

test('only named add-ons resolve', () => {
  assert.deepEqual(Object.keys(ADDONS), ['codex-ide', 'codex-cli']);
  assert.equal(getAddon('codex-ide').extensionId, 'openai.chatgpt');
  assert.equal(getAddon('codex-cli').packageName, '@openai/codex');
  assert.equal(getAddon('arbitrary-package'), undefined);
  assert.equal(getAddon('__proto__'), undefined);
  assert.equal(getAddon({ id: 'codex-ide' }), undefined);
});

test('page has a content policy and a Codexsun OS title', () => {
  const html = pageHtml('test-nonce');
  assert.match(html, /<title>Codexsun OS<\/title>/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /script-src 'nonce-test-nonce'/);
  assert.doesNotMatch(html, /List density|data-density/);
});
