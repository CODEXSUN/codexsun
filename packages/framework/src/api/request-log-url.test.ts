import assert from "node:assert/strict";
import { test } from "node:test";
import { requestLogUrl } from "./request-log-url.js";
test("request telemetry omits query credentials and personal data", () => {
  assert.equal(
    requestLogUrl("/public/form?token=private&email=person@example.test"),
    "/public/form"
  );
  assert.equal(requestLogUrl("/health"), "/health");
});
