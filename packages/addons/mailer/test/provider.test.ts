import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createMailerService, definition, routes } from "../src/index.js";

test("declares the mailer provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "mailer.provider");
  assert.deepEqual(provider.manifest.contracts, ["mailer.v1"]);
  assert.equal(routes[0].contract, "mailer.v1");
});

test("runs the mailer purpose-specific backend action", () => {
  const record = createMailerService().sendEmail({ to: ["ops@example.test"], subject: "Welcome" });
  assert.equal(record.status, "draft");
  assert.equal(record.subject, "Welcome");
});
