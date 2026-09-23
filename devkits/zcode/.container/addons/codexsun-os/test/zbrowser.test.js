const assert = require('node:assert/strict');
const test = require('node:test');
const { zbrowserHtml } = require('../src/zbrowser-page');

test('Zbrowser groups registered previews without embedding an unsafe iframe', () => {
  const html = zbrowserHtml('test-nonce');
  assert.match(html, /<title>Zbrowser<\/title>/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /script-src 'nonce-test-nonce'/);
  assert.match(html, /\['apps', 'Apps'\]/);
  assert.match(html, /\['devkits', 'Devkits'\]/);
  assert.match(html, /actionButton\('Start'/);
  assert.match(html, /actionButton\('Open'/);
  assert.doesNotMatch(html, /<iframe/i);
});
