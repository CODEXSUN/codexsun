const { execFileSync } = require('node:child_process');

const SERVICE_NAME = 'CODEXSUNQCafePrint';
const DISPLAY_NAME = 'CODEXSUN Q Cafe Raw Print Service';
const executable = process.argv[2];

if (!executable) {
  throw new Error('Q Cafe print-service executable path is missing.');
}

function runSc(args, allowFailure = false) {
  try {
    execFileSync('sc.exe', args, { stdio: 'ignore', windowsHide: true });
    return true;
  } catch (error) {
    if (allowFailure) return false;
    throw error;
  }
}

runSc(['stop', SERVICE_NAME], true);
if (!runSc(['query', SERVICE_NAME], true)) {
  runSc([
    'create', SERVICE_NAME,
    'binPath=', `"${executable}"`,
    'start=', 'auto',
    'DisplayName=', DISPLAY_NAME,
  ]);
} else {
  runSc([
    'config', SERVICE_NAME,
    'binPath=', `"${executable}"`,
    'start=', 'auto',
    'DisplayName=', DISPLAY_NAME,
  ]);
}
runSc(['start', SERVICE_NAME], true);
