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
} else {
  throw new Error('Expected brand command');
}
