import {CXForgeCommands} from './client.ts';

const origin = process.env.CXFORGE_API_ORIGIN ?? 'http://127.0.0.1:6400';
const preview = process.env.CXFORGE_PREVIEW_ORIGIN ?? 'http://127.0.0.1:7300';
const client = new CXForgeCommands(origin, process.env.CXFORGE_ZUNO_CLIENT_KEY ?? 'local-zuno-to-cxforge-client-key-32chars');
const id = `flat-tools-${Date.now()}`;
await client.submit({
  requestId: id,
  title: 'Verify flat workspace and Go command tools',
  steps: [
    {directory: '.', timeoutSeconds: 30, argv: ['sh', '-c', 'test "$PWD" = /workspace && test -d .git && test ! -d repo && printf "flat-workspace-ok\\n" > .cxforge/worker-smoke.txt && grep flat-workspace-ok .cxforge/worker-smoke.txt']},
    {directory: '.', timeoutSeconds: 30, argv: ['git', 'rev-parse', '--show-toplevel']},
    {directory: '.', timeoutSeconds: 30, argv: ['npm', '--version']},
  ],
});
const deadline = Date.now() + 120000;
while (Date.now() < deadline) {
  const task = await client.get(id);
  if (task.status === 'review') {
    if (task.tools.results?.length !== 3 || task.tools.results.some(result => result.exitCode !== 0)) throw new Error('Command verification failed');
    for (const path of ['/', '/api/v1/zuno/health']) {
      const response = await fetch(`${preview}${path}`, {signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error(`Preview check failed: ${path} HTTP ${response.status}`);
    }
    console.log(JSON.stringify({requestId: id, checkout: '/workspace', readEditTest: 'passed', preview: 'passed'}));
    process.exit(0);
  }
  if (['blocked', 'failed', 'cancelled'].includes(task.status)) throw new Error(task.report);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
throw new Error('Command verification timed out');
