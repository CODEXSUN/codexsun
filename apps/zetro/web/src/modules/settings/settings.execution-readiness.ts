import { readSandbox } from './settings.sandbox.services'
import { hasCurrentEvidence } from './settings.startup-policy'

/** Read-only preflight. Never starts paid verification or changes the approved policy. */
export async function assertExecutionReady() {
  const status = await readSandbox()
  if (!hasCurrentEvidence(status)) {
    throw new Error(
      'Your draft is preserved. Execution verification is not current. Open Settings → Codex connection → Verify enforcement, then send again.',
    )
  }
}
