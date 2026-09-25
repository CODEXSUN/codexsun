import assert from "node:assert/strict";
import test from "node:test";
import { MailerModuleProvider } from "../provider.js";

test("declares the mailer module owner and events", () => {
  const provider = new MailerModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/mailer/modules/mailer");
  assert.equal(provider.manifest.contracts[0], "mailer.v1");
});
