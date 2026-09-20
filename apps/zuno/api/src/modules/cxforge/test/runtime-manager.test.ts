import assert from "node:assert/strict";
import test from "node:test";
import { CxforgeRuntimeManager, type RuntimeCommandRunner } from "../runtime-manager.js";

test("reports the allowlisted CXForge container and development toolchain", async () => {
  const calls: string[] = [];
  const run: RuntimeCommandRunner = async (command, args) => {
    calls.push([command, ...args].join(" "));
    const joined = args.join(" ");
    if (joined.startsWith("version")) return output("27.5.1");
    if (joined.startsWith("compose version")) return output("2.33.1");
    if (joined.startsWith("inspect")) return output(JSON.stringify({ Config: { Image: "cxforgefresh-cxforge" }, Id: "abcdef1234567890", Name: "/cxforge", State: { Health: { Status: "healthy" }, Running: true, Status: "running" } }));
    if (joined.includes("go version")) return output("go version go1.23.6 linux/amd64");
    if (joined.includes("node --version")) return output("v22.14.0");
    if (joined.includes("npm --version")) return output("10.9.2");
    if (joined.includes("python3 --version")) return output("Python 3.12.9");
    if (joined.includes("git --version")) return output("git version 2.47.2");
    throw new Error(`Unexpected command: ${joined}`);
  };

  const status = await new CxforgeRuntimeManager({ repositoryRoot: "C:/repo", run }).status();

  assert.equal(status.dockerAvailable, true);
  assert.equal(status.container.health, "healthy");
  assert.equal(status.container.id, "abcdef123456");
  assert.match(status.toolchain.go ?? "", /go1\.23\.6/u);
  assert.equal(calls.every((call) => !call.includes("orship")), true);
});

test("uses fixed compose arguments for install and creates the shared local network", async () => {
  const calls: string[] = [];
  const run: RuntimeCommandRunner = async (command, args) => {
    const joined = [command, ...args].join(" ");
    calls.push(joined);
    if (args[0] === "network" && args[1] === "inspect") throw new Error("missing");
    if (args[0] === "inspect") throw new Error("not installed");
    return output(args[0] === "version" ? "27.5.1" : "ok");
  };

  await new CxforgeRuntimeManager({ repositoryRoot: "C:/repo", run }).act("install");

  assert.equal(calls.some((call) => call === "docker network create codexsun-network"), true);
  assert.equal(calls.some((call) => call.includes("compose -p cxforgefresh -f") && call.endsWith("up -d --build")), true);
});

function output(stdout: string) {
  return { stderr: "", stdout };
}
