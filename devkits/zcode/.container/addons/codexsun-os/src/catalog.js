const ADDONS = Object.freeze({
  'codex-ide': Object.freeze({
    id: 'codex-ide',
    name: 'Codex IDE',
    detail: 'Editor extension',
    extensionId: 'openai.chatgpt',
  }),
  'codex-cli': Object.freeze({
    id: 'codex-cli',
    name: 'Codex CLI',
    detail: 'Terminal command',
    packageName: '@openai/codex',
    packageVersion: '0.156.1',
  }),
});

function getAddon(id) {
  return typeof id === 'string' && Object.hasOwn(ADDONS, id) ? ADDONS[id] : undefined;
}

module.exports = { ADDONS, getAddon };
