import assert from "node:assert/strict"
import test from "node:test"

import { formatHttpErrorMessage } from "../../../apps/cxapp/web/src/lib/http-error.ts"

test("formatHttpErrorMessage preserves startup failure detail", () => {
  assert.equal(
    formatHttpErrorMessage(
      {
        message: "Database connection is unavailable.",
        detail:
          "The server is reachable, but it could not connect to the configured database. Confirm that the database server is running and that the DB host, port, name, user, and password are correct.",
      },
      503
    ),
    "Database connection is unavailable. The server is reachable, but it could not connect to the configured database. Confirm that the database server is running and that the DB host, port, name, user, and password are correct."
  )
})

test("formatHttpErrorMessage falls back to the status message when payload is empty", () => {
  assert.equal(
    formatHttpErrorMessage(null, 503),
    "Request failed with status 503."
  )
})
