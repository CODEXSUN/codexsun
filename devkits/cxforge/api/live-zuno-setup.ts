import {randomBytes} from 'node:crypto';
import {CXForgeCommands} from './client.ts';
const client=new CXForgeCommands(process.env.CXFORGE_API_ORIGIN ?? 'http://127.0.0.1:6400',process.env.CXFORGE_ZUNO_CLIENT_KEY ?? 'local-zuno-to-cxforge-client-key-32chars');
const id=process.env.CXFORGE_SETUP_ID ?? `zuno-setup-${Date.now()}`;
const token=()=>randomBytes(32).toString('hex');
const environment={
  DB_DRIVER:'sqlite',CXFORGE_SQLITE_PATH:'/workspace/.cxforge/zuno-data/zuno_db.sqlite',
  ZUNO_REPOSITORY_ROOT:'/workspace',ZUNO_DATA_ROOT:'/workspace/.cxforge/zuno-data',
  ZUNO_API_PORT:'6410',ZUNO_WEB_PORT:'6411',PLATFORM_HOST:'0.0.0.0',
  ZUNO_API_REFERENCE_TOKEN:token(),ZUNO_CXFORGE_API_URL:'http://127.0.0.1:6400',
  ZUNO_CXFORGE_CLIENT_KEY:process.env.CXFORGE_ZUNO_CLIENT_KEY ?? 'local-zuno-to-cxforge-client-key-32chars',
  ZUNO_ZETRO_CLIENT_KEY:token(),PLATFORM_JWT_SECRET:token(),
  APP_MODE:'production',AUTO_LOGIN:'0',REFRESH_IDENTITY_SEED:'0',
  SUPER_ADMIN_NAME:'Preview administrator',SUPER_ADMIN_LOGIN:'preview-admin@example.invalid',SUPER_ADMIN_PASSWORD:token(),
  ADMIN_NAME:'Preview user',ADMIN_LOGIN:'preview@example.invalid',ADMIN_PASSWORD:token(),
  VITE_ZUNO_API_URL:'http://127.0.0.1:6410',ZUNO_WEB_ORIGIN:'http://127.0.0.1:7300',
  CXFORGE_PREVIEW_BASE:`/preview/${id}/`,
};
const step=(argv:string[], timeoutSeconds=60)=>({argv,directory:'.',timeoutSeconds});
await client.setup({requestId:id,title:'Prepare Zuno with local SQLite',directory:'.',approved:true,
  preset:'zuno',environment,
  repository:{name:'CODEXSUN',repository:'https://github.com/CODEXSUN/codexsun.git',defaultBranch:'main',gitConnectionId:process.env.CXFORGE_GIT_CONNECTION_ID},
  sqlitePath:'.cxforge/zuno-data/zuno_db.sqlite',
  install:step(['npm','ci','--no-audit','--no-fund'],300),
  migrationStatus:step(['node_modules/.bin/tsx','.cxforge/zuno-migrations.ts','status']),
  migrate:step(['node_modules/.bin/tsx','.cxforge/zuno-migrations.ts','migrate']),
  migrationVerify:step(['node_modules/.bin/tsx','.cxforge/zuno-migrations.ts','verify']),
  previewCommand:'exec node .cxforge/zuno-preview.mjs',
});
console.log(JSON.stringify({requestId:id,status:'submitted'}));
const deadline=Date.now()+600000;
let previous='';
while (Date.now()<deadline) {
  const task=await client.get(id);
  if (task.status!==previous) console.log(JSON.stringify({requestId:id,status:task.status,report:task.report}));
  previous=task.status;
  if (task.status==='review') {
    console.log(JSON.stringify({requestId:id,previewUrl:task.previewUrl,status:'ready'}));
    process.exit(0);
  }
  if (['blocked','failed','cancelled'].includes(task.status)) throw new Error(task.report);
  await new Promise(resolve=>setTimeout(resolve,2000));
}
throw new Error('Setup verification timed out; inspect the task before retrying');
