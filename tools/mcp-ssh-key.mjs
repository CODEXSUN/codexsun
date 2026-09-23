import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const command = process.argv[2] || "help";
const name = process.argv[3] || "logicx";
const keyDirectory = resolve(root, "storage", "runtime", "ssh");
const privateKey = resolve(keyDirectory, `${name}_ed25519`);
const publicKey = `${privateKey}.pub`;

if (command === "generate") generate();
else if (command === "install") await install();
else if (command === "help") printHelp();
else throw new Error("Use generate, install, or help.");

function generate() {
  mkdirSync(keyDirectory, { recursive: true });
  if (existsSync(privateKey) || existsSync(publicKey)) throw new Error(`Key already exists: ${privateKey}. Use a new name.`);
  const result = spawnSync("ssh-keygen", ["-t", "ed25519", "-f", privateKey, "-N", "", "-C", `codexsun-${name}`], { stdio: "inherit", windowsHide: true });
  if (result.error || result.status !== 0) throw new Error("ssh-keygen failed. Install Windows OpenSSH Client and retry.");
  console.log(`Private key: ${privateKey}`);
  console.log(`Public key:  ${publicKey}`);
  console.log("Next: run the install command with the server username and host. It will prompt for the server password interactively.");
}

async function install() {
  const user = option("--user");
  const host = option("--host");
  const port = option("--port") || "22";
  if (!user || !host) throw new Error("Install requires --user and --host.");
  if (!existsSync(publicKey)) throw new Error(`Generate the key first: npm run mcp:ssh:keygen -- generate ${name}`);
  const key = readFileSync(publicKey, "utf8");
  const remoteCommand = "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys";
  await run("ssh", ["-p", port, `${user}@${host}`, remoteCommand], key);
  console.log(`Public key installed for ${user}@${host}:${port}.`);
  console.log(`Set CODEXSUN_MCP_SSH_TARGETS with keyPath ${privateKey}, then start npm run mcp:server.`);
}

function run(program, args, input) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(program, args, { stdio: ["pipe", "inherit", "inherit"], windowsHide: true });
    child.once("error", reject);
    child.once("close", (status) => status === 0 ? resolvePromise() : reject(new Error(`${program} exited with ${status}.`)));
    child.stdin.end(input);
  });
}

function option(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printHelp() {
  console.log("Usage:");
  console.log("  npm run mcp:ssh:keygen -- generate logicx");
  console.log("  npm run mcp:ssh:keygen -- install logicx --user LOGIN --host logicx.ignorelist.com --port 2122");
}
