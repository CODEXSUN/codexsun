// Supervise both project services inside CXForge's preview process group.
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readdir, readFile} from 'node:fs/promises';
const root = process.env.ZUNO_REPOSITORY_ROOT;
const port = process.env.PORT;
if (!root || !port) throw new Error('Repository root and preview port required');
// The shared app catalog reads every registered port, even for an isolated preview.
for (const file of await readdir(`${root}/core/registry/applications`)) {
  if (!file.endsWith('.json')) continue;
  const application = JSON.parse(await readFile(`${root}/core/registry/applications/${file}`, 'utf8'));
  const host = application.hosts?.find(host => host.kind === 'web')
    ?? application.hosts?.find(host => host.kind === 'api');
  const key = application.mdi?.localUrlKey;
  if (key && host?.defaultPort) process.env[key] ??= String(host.defaultPort);
}
const options = {stdio:'inherit',env:{...process.env,APP_MODE:'production',ZUNO_WEB_PORT:port}};
const api = spawn(`${root}/node_modules/.bin/tsx`,['src/server.ts'],{...options,cwd:`${root}/devkits/zuno/api`});
let web;
let stopping = false;
function stop(code) { if(stopping)return; stopping=true; api.kill(); web?.close(); setTimeout(()=>process.exit(code),300); }
api.on('exit',()=>stop(1));
process.on('SIGTERM',()=>stop(0));
process.on('SIGINT',()=>stop(0));
const deadline=Date.now()+30000;
let ready=false;
while(Date.now()<deadline && !stopping) {
  try { const response=await fetch(`http://127.0.0.1:${process.env.ZUNO_API_PORT}/api/v1/zuno/health`); if(response.ok){ready=true;break;} } catch {}
  await new Promise(resolve=>setTimeout(resolve,250));
}
if(!ready){stop(1);throw new Error('Zuno backend health check failed');}
const {createServer}=await import(pathToFileURL(`${root}/node_modules/vite/dist/node/index.js`).href);
web=await createServer({root:`${root}/devkits/zuno/web`,configFile:`${root}/devkits/zuno/web/vite.config.ts`,base:'/',
  define:{'import.meta.env.VITE_ZUNO_API_URL':JSON.stringify('')},
  server:{host:'0.0.0.0',port:Number(port),strictPort:true,proxy:{'/api':`http://127.0.0.1:${process.env.ZUNO_API_PORT}`}},
});
await web.listen();
console.log('Zuno backend ready; frontend starting');
