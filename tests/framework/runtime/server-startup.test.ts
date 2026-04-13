import assert from "node:assert/strict"
import test from "node:test"

import { describeStartupFailure } from "../../../apps/framework/src/server/index.ts"

test("describeStartupFailure explains database connectivity failures clearly", () => {
  assert.deepEqual(
    describeStartupFailure("connect ECONNREFUSED 127.0.0.1:3306"),
    {
      summary: "Database connection is unavailable.",
      detail:
        "The server is reachable, but it could not connect to the configured database. Confirm that the database server is running and that the DB host, port, name, user, and password are correct.",
    }
  )
})

test("describeStartupFailure falls back to a generic startup message for other errors", () => {
  assert.deepEqual(
    describeStartupFailure("Failed to load TLS certificate."),
    {
      summary: "The application could not finish startup.",
      detail: "Failed to load TLS certificate.",
    }
  )
})
