import { useEffect, useState } from 'react'
import type { CodingWorkerAttempt, CodingWorkerHandoffRequest } from '@codexsun/zetro-contracts'
import {
  approveCodingWorker,
  archiveCodingWorker,
  cleanupCodingWorker,
  fetchCodingWorkerAttempts,
  prepareCodingWorker,
  rejectCodingWorker,
  integrateCodingWorker,
  startCodingWorker,
  stopCodingWorker,
  verifyCodingWorker,
} from './coding-worker.services'

type WorkerAction = 'approve' | 'reject' | 'start' | 'stop' | 'verify' | 'archive' | 'cleanup' | 'integrate'

export function useCodingWorkers(active: boolean, setError: (value: string) => void) {
  const [attempts, setAttempts] = useState<CodingWorkerAttempt[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!active || !attempts.some((item) => item.execution.status === 'working')) return undefined
    const interval = window.setInterval(() => {
      fetchCodingWorkerAttempts().then(setAttempts).catch(() => undefined)
    }, 1_000)
    return () => window.clearInterval(interval)
  }, [active, attempts])

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      setAttempts(await fetchCodingWorkerAttempts())
    } catch (reason) {
      setError(messageFrom(reason, 'Could not load coding workers.'))
    } finally {
      setBusy(false)
    }
  }

  async function prepare(input: CodingWorkerHandoffRequest) {
    setBusy(true)
    setError('')
    try {
      const attempt = await prepareCodingWorker(input)
      setAttempts((current) => [attempt, ...current])
    } catch (reason) {
      setError(messageFrom(reason, 'Could not prepare the coding worker.'))
    } finally {
      setBusy(false)
    }
  }

  async function update(attemptId: string, action: WorkerAction) {
    setBusy(true)
    setError('')
    try {
      const attempt = await actionFor(action, attemptId)
      setAttempts((current) => current.map((item) => (item.id === attempt.id ? attempt : item)))
    } catch (reason) {
      setError(messageFrom(reason, 'Could not update the coding worker.'))
    } finally {
      setBusy(false)
    }
  }

  return { attempts, busy, prepare, refresh, update }
}

function actionFor(action: WorkerAction, attemptId: string) {
  if (action === 'approve') return approveCodingWorker(attemptId)
  if (action === 'archive') return archiveCodingWorker(attemptId)
  if (action === 'cleanup') return cleanupCodingWorker(attemptId)
  if (action === 'integrate') return integrateCodingWorker(attemptId)
  if (action === 'reject') return rejectCodingWorker(attemptId)
  if (action === 'start') return startCodingWorker(attemptId)
  if (action === 'stop') return stopCodingWorker(attemptId)
  return verifyCodingWorker(attemptId)
}

function messageFrom(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}
