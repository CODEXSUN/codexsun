// Copy into the cloned checkout's .cxforge directory before running with tsx.
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const root = process.env.ZUNO_REPOSITORY_ROOT!;
if (!root) throw new Error('ZUNO_REPOSITORY_ROOT required');
process.chdir(resolve(root, 'devkits/zuno/api'));
const {readConfig} = await import(pathToFileURL(resolve(root, 'devkits/zuno/api/src/config.ts')).href);
const {LocalIdentityStore} = await import(pathToFileURL(resolve(root, 'packages/platform-core/src/local-identity.ts')).href);
const configuration = readConfig();
const mode = process.argv[2];
if (mode === 'status') {
  if (!existsSync(configuration.databasePath)) console.log('Identity database pending');
  else {
    const db = new DatabaseSync(configuration.databasePath, {readOnly: true});
    const table = db.prepare("SELECT name FROM sqlite_master WHERE name='identity_migration_state'").get();
    console.log(table ? db.prepare('SELECT id,sequence FROM identity_migration_state ORDER BY sequence').all() : 'Identity migrations pending');
    db.close();
  }
} else if (mode === 'migrate') {
  const identity = new LocalIdentityStore({...configuration, appMode:'development'});
  await identity.initialize();
  identity.close();
  const {ZunoHandoffStore} = await import(pathToFileURL(resolve(root,'devkits/zuno/api/src/modules/handoff/handoff-store.ts')).href);
  const {PortalStore} = await import(pathToFileURL(resolve(root,'devkits/zuno/api/src/modules/cxforge/portal-store.ts')).href);
  new ZunoHandoffStore(configuration.handoffDatabasePath).close();
  new PortalStore(resolve(configuration.dataRoot,'zuno_control.sqlite'),process.env.PLATFORM_JWT_SECRET!).close();
  console.log('Zuno identity, handoff and portal schemas prepared');
} else if (mode === 'verify') {
  const identity = new LocalIdentityStore({...configuration,appMode:'production'});
  await identity.initialize();
  identity.close();
  for (const [file, tables] of [
    [configuration.databasePath,['identity_migration_state']],
    [configuration.handoffDatabasePath,['zuno_zetro_handoffs']],
    [resolve(configuration.dataRoot,'zuno_control.sqlite'),['portal_servers','portal_values','portal_commands','portal_events']],
  ] as [string,string[]][]) {
    const db = new DatabaseSync(file,{readOnly:true});
    for (const table of tables) if (!db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(table)) throw new Error(`Missing table ${table}`);
    if (Object.values(db.prepare('PRAGMA quick_check').get()!)[0] !== 'ok') throw new Error('SQLite integrity check failed');
    db.close();
  }
  console.log('MIGRATIONS_VERIFIED: identity checksum/order and all three SQLite stores');
} else throw new Error('Use status, migrate or verify');
