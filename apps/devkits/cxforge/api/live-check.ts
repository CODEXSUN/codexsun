import assert from 'node:assert/strict';
import { CXForgeCommands, type CommandRequest } from './client.ts';

const origin = process.env.CXFORGE_TEST_ORIGIN ?? 'http://127.0.0.1:6400';
const key = process.env.CXFORGE_ZUNO_CLIENT_KEY ?? 'local-zuno-to-cxforge-client-key-32chars';
const client = new CXForgeCommands(origin, key);
const prefix = `live-${Date.now()}`;
const started = Date.now();

assert.equal((await fetch(`${origin}/api/v1/cxforge/control/commands`, {
  method: 'POST', body: '{}', headers: {'Content-Type': 'application/json'},
})).status, 401);
await assert.rejects(client.submit({requestId: `${prefix}-invalid`, title: 'Invalid path',
  steps: [{argv: ['pwd'], directory: '../', timeoutSeconds: 10}]}), /directory/);

async function wait(id: string) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const task = await client.get(id);
    if (task.status === 'review' || task.status === 'blocked') return task;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Task timed out: ${id}`);
}

const fixture = '.cxforge-worker-check';
const writeScript = `from pathlib import Path
import hashlib
p=Path('${fixture}/data');p.mkdir(parents=True,exist_ok=False)
data=b'CXFORGE_SEARCH_MARKER\\n'+b'x'*16362
for i in range(2048):(p/str(i)).write_bytes(data)
digest=hashlib.sha256(data).digest()
assert all(hashlib.sha256(f.read_bytes()).digest()==digest for f in p.iterdir())
print('VERIFIED files=2048 bytes='+str(2048*len(data)))`;
const cleanScript = `from pathlib import Path
import shutil
p=Path('${fixture}/data').resolve()
assert p.parent==Path('${fixture}').resolve() and p.name=='data'
shutil.rmtree(p)
print('Fixture data removed')`;
const request: CommandRequest = {
  requestId: `${prefix}-heavy`, title: 'Live tools reliability test',
  steps: [
    { argv: ['python3', '-c', writeScript], directory: '.', timeoutSeconds: 60 },
    { argv: ['sh', '-c', `test "$(grep -rl CXFORGE_SEARCH_MARKER ${fixture}/data | wc -l)" -eq 2048 && echo SEARCH_PASS`], directory: '.', timeoutSeconds: 30 },
    { argv: ['node', '-e', 'let n=0;for(let i=0;i<10000000;i++)n+=i;if(n!==49999995000000)process.exit(1);console.log("PROCESS_PASS")'], directory: '.', timeoutSeconds: 30 },
    { argv: ['python3', '-c', cleanScript], directory: '.', timeoutSeconds: 30 },
  ],
};
await client.submit(request);
const heavy = await wait(request.requestId);
assert.equal(heavy.status, 'review', heavy.report);
assert.equal(heavy.tools.results?.length, 4);
assert.equal((await client.submit(request)).id, request.requestId);
await assert.rejects(client.submit({ ...request, title: 'Conflicting ID' }), /different commands/);

const queue = Array.from({ length: 12 }, (_, i) => ({
  requestId: `${prefix}-queue-${i}`, title: `Queue check ${i}`,
  steps: [{ argv: ['node', '-e', `console.log(${i})`], directory: '.', timeoutSeconds: 20 }],
}));
await Promise.all(queue.map(input => client.submit(input)));
const results = await Promise.all(queue.map(input => wait(input.requestId)));
assert(results.every(task => task.status === 'review'));

for (const [label, argv, timeout, code] of [
  ['failure', ['sh', '-c', 'exit 7'], 10, 7],
  ['timeout', ['sh', '-c', 'sleep 30'], 1, 124],
  ['output', ['python3', '-c', 'print("x"*2000000)'], 20, 0],
] as const) {
  const id = `${prefix}-${label}`;
  await client.submit({requestId: id, title: label, steps: [{argv: [...argv], directory: '.', timeoutSeconds: timeout}]});
  const task = await wait(id);
  const result = task.tools.results![0];
  assert.equal(result.exitCode, code);
  if (label === 'output') {
    assert.equal(result.truncated, true);
    assert(result.output.length <= 262144);
  }
}

const cancelId = `${prefix}-cancel`;
await client.submit({ requestId: cancelId, title: 'Cancel check', steps: [{argv: ['sh', '-c', 'sleep 30'], directory: '.', timeoutSeconds: 60}] });
await new Promise(resolve => setTimeout(resolve, 400));
await client.cancel(cancelId);
assert.equal((await wait(cancelId)).status, 'blocked');

const previewId = `${prefix}-preview`;
const html = '<!doctype html><title>CXForge tools check</title><style>body{font:18px system-ui;background:#10231d;color:#e7fff0;margin:8vw}h1{color:#61dfab}article{padding:32px;border:1px solid #42685a;border-radius:16px}</style><article><h1>CXForge tools-only worker</h1><p>Live command API verification</p><p>2,048 files written, read, hashed and searched.</p><p>10 million processing iterations verified.</p><p>Serial queue, timeout, cancellation and output limits tested.</p><p>No model required.</p></article>';
const writePreview = `const fs=require('fs');fs.mkdirSync('${fixture}/web',{recursive:true});fs.writeFileSync('${fixture}/web/index.html',${JSON.stringify(html)});fs.writeFileSync('${fixture}/web/package.json',JSON.stringify({scripts:{dev:'python3 -m http.server --bind 0.0.0.0'}}));`;
await client.submit({ requestId: previewId, title: 'Live preview check', steps: [{argv: ['node', '-e', writePreview], directory: '.', timeoutSeconds: 10}], previewCommand: `cd ${fixture}/web && exec npm run dev -- {port}` });
const preview = await wait(previewId);
assert.equal(preview.status, 'review', preview.report);
assert(preview.previewUrl);
for (let i = 0; i < 25; i++) {
  await Promise.all(Array.from({length: 20}, async () => {
    const response = await fetch(preview.previewUrl!, {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200);
    assert((await response.text()).includes('No model required.'));
  }));
}
console.log(JSON.stringify({status: 'passed', modelUsed: false, files: 2048, processingIterations: 10000000, queuedCommands: 12, previewRequests: 500, previewUrl: preview.previewUrl, seconds: (Date.now()-started)/1000}));
