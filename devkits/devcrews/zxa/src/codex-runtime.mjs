import { spawn } from "node:child_process";

export class CodexRuntime {
  constructor(command = process.env.ZXA_CODEX_COMMAND || "codex", spawnProcess = spawn) {
    this.command = command;
    this.spawnProcess = spawnProcess;
    this.deviceLogin = undefined;
  }

  async status() {
    const result = await this.execute(["login", "status"], 10_000);
    const output = `${result.stdout}\n${result.stderr}`.trim();
    const connected = result.code === 0 && !/not logged in|not authenticated|logged out/i.test(output);
    return { account: connected ? await this.account() : undefined, cli: await this.version(), connected, message: output || (connected ? "Codex is connected." : "Codex is not connected.") };
  }

  account() {
    return new Promise((resolve) => {
      const child = this.spawnProcess(this.command, ["app-server"], { env: process.env, stdio: ["pipe", "pipe", "pipe"] });
      let buffer = "";
      const timeout = setTimeout(() => { child.kill(); resolve(undefined); }, 10_000);
      const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
      const read = (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            if (message.id === 0 && message.result) { send({ method: "initialized", params: {} }); send({ id: 1, method: "account/read", params: {} }); }
            if (message.id === 1) { clearTimeout(timeout); child.kill(); resolve(message.result?.account); }
          } catch { /* Ignore non-protocol output. */ }
        }
      };
      child.stdout.on("data", read);
      child.stderr.on("data", read);
      child.once("error", () => { clearTimeout(timeout); resolve(undefined); });
      child.once("close", () => { clearTimeout(timeout); resolve(undefined); });
      send({ id: 0, method: "initialize", params: { clientInfo: { name: "zxa", title: "ZXA", version: "1.0.0" } } });
    });
  }

  async startDeviceCode() {
    if (this.deviceLogin) return this.deviceLogin.code;
    const child = this.spawnProcess(this.command, ["app-server"], { env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    const code = await this.waitForCode(child);
    this.deviceLogin = { child, code };
    child.once("close", () => { this.deviceLogin = undefined; });
    child.once("error", () => { this.deviceLogin = undefined; });
    return code;
  }

  async version() {
    const result = await this.execute(["--version"], 5_000);
    return result.code === 0 ? result.stdout.trim() : "unavailable";
  }

  async signOut() {
    const result = await this.execute(["logout"], 10_000);
    if (result.code !== 0) throw new Error(result.stderr.trim() || "Codex could not sign out.");
    return this.status();
  }

  execute(args, timeoutMs) {
    return new Promise((resolve) => {
      const child = this.spawnProcess(this.command, args, { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => child.kill(), timeoutMs);
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.once("error", (error) => { clearTimeout(timeout); resolve({ code: 1, stderr: error.message, stdout }); });
      child.once("close", (code) => { clearTimeout(timeout); resolve({ code: code ?? 1, stderr, stdout }); });
    });
  }

  waitForCode(child) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { child.kill(); reject(new Error("Codex did not provide a device code.")); }, 15_000);
      const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
      const onData = (chunk) => {
        for (const line of chunk.toString().split("\n")) this.handleDeviceMessage(line, send, (result) => {
          clearTimeout(timeout);
          resolve(result);
        }, (error) => { clearTimeout(timeout); reject(error); });
      };
      child.stdout.on("data", onData);
      child.stderr.on("data", onData);
      child.once("error", (error) => { clearTimeout(timeout); reject(error); });
      child.once("close", () => { clearTimeout(timeout); reject(new Error("The device-code session closed before Codex returned a code.")); });
      send({ id: 0, method: "initialize", params: { clientInfo: { name: "zxa", title: "ZXA", version: "1.0.0" } } });
    });
  }

  handleDeviceMessage(line, send, resolve, reject) {
    let message;
    try { message = JSON.parse(line); }
    catch { return; }
    if (message.id === 0 && message.result) {
      send({ method: "initialized", params: {} });
      send({ id: 1, method: "account/login/start", params: { type: "chatgptDeviceCode" } });
      return;
    }
    if (message.id === 1 && message.result?.type === "chatgptDeviceCode") {
      const { userCode, verificationUrl } = message.result;
      if (!userCode || !verificationUrl) return;
      resolve({ message: "Enter this one-time code in the browser to connect Codex.", status: "awaiting", userCode, verificationUrl });
    }
    if (message.id === 1 && message.error) reject(new Error("Codex could not request a device code from OpenAI."));
  }
}
