import { spawn } from "node:child_process";

export function createSshProvider(config, runner = runProcess) {
  return {
    targets() {
      return Object.entries(config.sshTargets).map(([id, target]) => ({
        id,
        host: target.host,
        port: target.port || 22,
        user: target.user,
        configuredCommands: config.sshAllowedCommands[id] || [],
      }));
    },
    async exec(targetId, command) {
      const target = config.sshTargets[targetId];
      if (!target || typeof target.host !== "string" || typeof target.user !== "string") throw new Error("SSH target is not configured.");
      const allowed = config.sshAllowedCommands[targetId] || [];
      if (!allowed.includes(command)) throw new Error("SSH command is not allowlisted.");
      const args = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=10", "-p", String(target.port || 22)];
      if (target.keyPath) args.push("-i", target.keyPath);
      args.push(`${target.user}@${target.host}`, command);
      return runner("ssh", args, config.repositoryRoot);
    },
  };
}

function runProcess(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (exitCode) => resolve({ exitCode, output: output.slice(-100_000) }));
  });
}
