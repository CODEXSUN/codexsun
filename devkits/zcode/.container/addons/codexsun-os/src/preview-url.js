function previewUrl(port, host = '127.0.0.1', scheme = 'http', template = '') {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid preview port.');
  }
  if (template) {
    if (!template.includes('{port}')) throw new Error('Preview URL template must contain {port}.');
    let url;
    try { url = new URL(template.replaceAll('{port}', String(port))); }
    catch { throw new Error('Invalid preview URL template.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        ['0.0.0.0', '[::]'].includes(url.hostname) || /[{}]/u.test(url.href)) {
      throw new Error('Preview URL template must use HTTP(S) and a reachable host without credentials.');
    }
    return url.href;
  }
  if (!['http', 'https'].includes(scheme)) throw new Error('Preview scheme must be http or https.');
  host = host.trim();
  if (!host || /[\s/@?#\\]/u.test(host)) throw new Error('Preview host must be an IP address or hostname, without a URL or port.');
  const authority = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  let url;
  try {
    url = new URL(`${scheme}://${authority}:${port}/`);
  } catch {
    throw new Error('Preview host must be an IP address or hostname, without a URL or port.');
  }
  if (['0.0.0.0', '[::]'].includes(url.hostname)) {
    throw new Error('Use the reachable server IP or domain for previews, not a wildcard listening address.');
  }
  return url.href;
}

module.exports = { previewUrl };
