const assert = require('node:assert/strict');
const test = require('node:test');
const { zbrowserHtml } = require('../src/zbrowser-page');
const { runInNewContext } = require('node:vm');

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

test('cards render configured port badges and send typed clicks without trusting a URL', () => {
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  const groups = new Element('div');
  const notice = new Element('p');
  const messages = [];
  let render, click;
  const html = zbrowserHtml('test');
  const script = html.match(/<script nonce="test">([\s\S]*?)<\/script>/)[1];
  runInNewContext(script, {
    acquireVsCodeApi: () => ({ postMessage: (message) => messages.push(message) }),
    document: {
      getElementById: (id) => id === 'groups' ? groups : notice,
      createElement: (tag) => new Element(tag),
      body: { addEventListener: (_type, callback) => { click = callback; } },
    },
    window: { addEventListener: (_type, callback) => { render = callback; } },
  });
  render({ data: { type: 'state', notice: '', targets: [
    { id: 'crm', label: 'CRM', group: 'apps', state: 'ready', apiPort: 6204, webPort: 6205, port: 6140 },
    { id: 'uiux', label: 'UIUX', group: 'devkits', state: 'stopped', apiPort: null, webPort: 6102, port: 6133 },
  ] } });
  const card = groups.children[0].children[1];
  assert.equal(card.className, 'item');
  const badges = card.children.find((element) => element.className === 'ports').children;
  assert.deepEqual(badges.map((badge) => badge.children.map((span) => span.textContent)), [
    ['API', 6204], ['Web', 6205], ['Zbrowser', 6140],
  ]);
  assert.ok(badges.every((badge) => !badge.disabled));
  click({ target: { closest: () => badges[0] } });
  assert.equal(messages.at(-1).type, 'open-port');
  assert.equal(messages.at(-1).kind, 'api');
  assert.equal(messages.at(-1).id, 'crm');
  const stopped = groups.children[1].children[1].children.find((element) => element.className === 'ports').children;
  assert.equal(stopped[0].disabled, true);
  assert.equal(stopped[2].disabled, true);
});
