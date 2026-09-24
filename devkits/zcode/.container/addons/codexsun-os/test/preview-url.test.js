const assert = require('node:assert/strict');
const test = require('node:test');
const { previewUrl } = require('../src/preview-url');

test('preview URLs support local defaults, remote hosts, and mapped ports', () => {
  assert.equal(previewUrl(6140), 'http://127.0.0.1:6140/');
  assert.equal(previewUrl(6240, '192.0.2.10'), 'http://192.0.2.10:6240/');
  assert.equal(previewUrl(6240, 'preview.example.com', 'https'), 'https://preview.example.com:6240/');
  assert.equal(previewUrl(6140, '2001:db8::1'), 'http://[2001:db8::1]:6140/');
  assert.equal(previewUrl(6140, '[2001:db8::1]'), 'http://[2001:db8::1]:6140/');
});

test('preview URLs reject wildcard addresses and malformed configuration', () => {
  for (const host of ['0.0.0.0', '::', '[::]', '', 'https://example.com', 'example.com:1234', 'user@example.com', 'example.com/path', 'example.com?x=1']) {
    assert.throws(() => previewUrl(6140, host));
  }
  for (const port of [0, 65536, NaN, 12.5, '6140']) assert.throws(() => previewUrl(port));
  assert.throws(() => previewUrl(6140, 'example.com', 'javascript'));
});

test('port subdomains use HTTPS without appending the upstream port', () => {
  assert.equal(previewUrl(6140, undefined, undefined, 'https://{port}.tmnext.in/'), 'https://6140.tmnext.in/');
  assert.equal(previewUrl(6240, undefined, undefined, 'https://{port}.tmnext.in/'), 'https://6240.tmnext.in/');
  for (const template of ['https://tmnext.in/', 'javascript:{port}', 'https://user:pass@{port}.tmnext.in/', 'http://0.0.0.0:{port}/']) {
    assert.throws(() => previewUrl(6140, undefined, undefined, template));
  }
});
