import { spawn } from "node:child_process";

const child = spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run github:now"], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: "--require=./tools/temporary-tty-shim.cjs" },
  stdio: ["pipe", "inherit", "inherit"],
});
const answers = ["n\n", "\n", "y\n"];
answers.forEach((answer, index) => setTimeout(() => child.stdin.write(answer), 750 + index * 1_000));
child.on("close", (code) => process.exitCode = code ?? 1);
