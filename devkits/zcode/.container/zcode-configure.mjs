import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const productPath = '/home/.openvscode-server/product.json';
const webAssets = '/home/.openvscode-server/out';

function replaceOnce(path, before, after) {
  const source = readFileSync(path, 'utf8');
  if (source.split(before).length !== 2) {
    throw new Error(`Expected one occurrence of ${JSON.stringify(before)} in ${path}`);
  }
  writeFileSync(path, source.replace(before, after));
}

function assetVersion(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
}

if (process.argv[2] === 'brand') {
  const product = JSON.parse(readFileSync(productPath, 'utf8'));
  product.nameShort = 'Codexsun Zcode';
  product.nameLong = 'Codexsun Zcode';
  writeFileSync(productPath, `${JSON.stringify(product, null, 2)}\n`);

  const workbenchPath = `${webAssets}/vs/code/browser/workbench/workbench.js`;
  replaceOnce(workbenchPath, 'nameShort:"OpenVSCode Server",nameLong:"OpenVSCode Server"',
    'nameShort:"Codexsun Zcode",nameLong:"Codexsun Zcode"');
  replaceOnce(workbenchPath, 'default:"welcomePage",description:d(13874',
    'default:"none",description:d(13874');
  for (const file of ['nls.messages.js', 'nls.messages.json']) {
    replaceOnce(`${webAssets}/${file}`, 'Editing evolved', 'Think. Build. Deploy.');
  }

  const htmlPath = `${webAssets}/vs/code/browser/workbench/workbench.html`;
  replaceOnce(htmlPath, "performance.mark('code/didStartRenderer');", `
      const workspace = '/home/workspace/codexsun';
      const url = new URL(window.location.href);
      if (url.searchParams.get('folder') !== workspace) {
        url.searchParams.delete('workspace');
        url.searchParams.set('folder', workspace);
        window.location.replace(url.href);
      }
      performance.mark('code/didStartRenderer');`);
  for (const [asset, path] of [
    ['{{WORKBENCH_NLS_FALLBACK_URL}}', `${webAssets}/nls.messages.js`],
    ['{{WORKBENCH_WEB_BASE_URL}}/out/vs/code/browser/workbench/workbench.js', workbenchPath],
  ]) {
    replaceOnce(htmlPath, `src="${asset}"`, `src="${asset}?zcode=${assetVersion(path)}"`);
  }
} else {
  throw new Error('Expected brand command');
}
