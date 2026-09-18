import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import type { ZetroCodexDeviceCode } from "@codexsun/zetro-contracts";

type AppServerMessage = {
  id?: number;
  method?: string;
  params?: { success?: boolean };
  result?: { type?: string; userCode?: string; verificationUrl?: string };
};

export class CodexDeviceCode {
  private current: ZetroCodexDeviceCode = { status: "idle", message: "Generate a device code to connect Codex." };
  private process?: ChildProcessWithoutNullStreams;

  async generate(command: string): Promise<ZetroCodexDeviceCode> {
    if (this.current.status === "awaiting") return this.current;
    this.stop();
    return new Promise((resolve) => this.start(command, resolve));
  }

  status(): ZetroCodexDeviceCode {
    return this.current;
  }

  stop(): void {
    this.process?.kill();
    this.process = undefined;
  }

  private start(command: string, resolve: (result: ZetroCodexDeviceCode) => void): void {
    const child = spawn(command, ["app-server"], { shell: false, windowsHide: true });
    this.process = child;
    const finish = (result: ZetroCodexDeviceCode) => { clearTimeout(timeout); this.current = result; resolve(result); };
    const timeout = setTimeout(() => finish({ status: "failed", message: "Codex did not provide a device code. Try again." }), 15_000);
    const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
    child.once("error", () => finish({ status: "failed", message: "Zetro could not start the installed Codex CLI." }));
    child.once("close", () => { if (this.current.status === "awaiting") this.current = { status: "failed", message: "The device-code session closed before sign-in completed." }; });
    createInterface({ input: child.stdout }).on("line", (line) => this.handle(line, send, finish));
    send({ method: "initialize", id: 0, params: { clientInfo: { name: "zetro", title: "Zetro", version: "1.0.19" } } });
  }

  private handle(line: string, send: (message: unknown) => void, finish: (result: ZetroCodexDeviceCode) => void): void {
    const message = parse(line);
    if (!message) return;
    if (message.id === 0 && message.result) { send({ method: "initialized", params: {} }); send({ method: "account/login/start", id: 1, params: { type: "chatgptDeviceCode" } }); return; }
    if (message.id === 1 && message.result?.type === "chatgptDeviceCode") {
      const { userCode, verificationUrl } = message.result;
      if (userCode && verificationUrl) finish({ status: "awaiting", message: "Enter this one-time code in the browser to connect Codex.", userCode, verificationUrl });
      else finish({ status: "failed", message: "Codex returned an incomplete device-code response." });
      return;
    }
    if (message.method === "account/login/completed") { this.current = message.params?.success ? { status: "connected", message: "Codex sign-in completed. Recheck the local connection." } : { status: "failed", message: "Codex sign-in did not complete." }; this.stop(); }
  }
}

function parse(line: string): AppServerMessage | undefined { try { return JSON.parse(line) as AppServerMessage; } catch { return undefined; } }
