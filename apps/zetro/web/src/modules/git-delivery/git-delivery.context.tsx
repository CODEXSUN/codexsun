import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GitDeliveryContext } from './git-delivery.controller'
import {
  getGlobalGitDeliverySettings,
  getProjectGitDeliverySettings,
  listGitDeliveryFlows,
  previewGitDelivery,
  runGitDeliveryFlow,
  updateGlobalGitDeliverySettings,
  updateProjectGitDeliverySettings,
} from './git-delivery.services'
import type {
  GitDeliveryFlowInput,
  GitDeliveryFlowRecord,
  GitDeliveryPreview,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types'

export function GitDeliveryProvider({
  children,
  projectId,
}: {
  children: ReactNode
  projectId: string | null
}) {
  const [busy, setBusy] = useState(false)
  const [effective, setEffective] = useState<GitDeliverySettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flows, setFlows] = useState<GitDeliveryFlowRecord[]>([])
  const [global, setGlobal] = useState<GitDeliverySettings | null>(null)
  const [preview, setPreview] = useState<GitDeliveryPreview | null>(null)
  const [project, setProject] = useState<ProjectGitDeliverySettings | null>(null)

  const refresh = useCallback(
    async (title = 'Release changes') => {
      if (!projectId) return
      const [nextPreview, history] = await Promise.all([
        previewGitDelivery(projectId, title),
        listGitDeliveryFlows(projectId),
      ])
      setPreview(nextPreview)
      setFlows(history.flows)
    },
    [projectId],
  )

  useEffect(() => {
    void getGlobalGitDeliverySettings()
      .then(({ settings }) => setGlobal(settings))
      .catch((reason: unknown) => setError(toMessage(reason)))
  }, [])

  useEffect(() => {
    setPreview(null)
    setFlows([])
    if (!projectId) return
    void Promise.all([
      getProjectGitDeliverySettings(projectId),
      previewGitDelivery(projectId, 'Release changes'),
      listGitDeliveryFlows(projectId),
    ])
      .then(([settings, nextPreview, history]) => {
        setProject(settings.project)
        setEffective(settings.effective)
        setPreview(nextPreview)
        setFlows(history.flows)
        setError(null)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
  }, [projectId])

  const value = useMemo(
    () => ({
      busy,
      effective,
      error,
      flows,
      global,
      preview,
      project,
      refresh,
      run: async (input: GitDeliveryFlowInput) => {
        if (!projectId) throw new Error('Select a project first.')
        return withBusy(setBusy, setError, async () => {
          const flow = await runGitDeliveryFlow(projectId, input)
          setFlows((current) => [flow, ...current.filter(({ id }) => id !== flow.id)].slice(0, 10))
          await refresh(input.title)
          return flow
        })
      },
      saveGlobal: async (settings: GitDeliverySettings) => {
        await withBusy(setBusy, setError, async () => {
          const result = await updateGlobalGitDeliverySettings(settings)
          setGlobal(result.settings)
          if (project?.inheritGlobal) setEffective(result.settings)
        })
      },
      saveProject: async (settings: ProjectGitDeliverySettings) => {
        if (!projectId) return
        await withBusy(setBusy, setError, async () => {
          const result = await updateProjectGitDeliverySettings(projectId, settings)
          setProject(result.project)
          setEffective(result.effective)
        })
      },
    }),
    [busy, effective, error, flows, global, preview, project, projectId, refresh],
  )

  return <GitDeliveryContext.Provider value={value}>{children}</GitDeliveryContext.Provider>
}

async function withBusy<T>(
  setBusy: (value: boolean) => void,
  setError: (value: string | null) => void,
  action: () => Promise<T>,
): Promise<T> {
  setBusy(true)
  try {
    const result = await action()
    setError(null)
    return result
  } catch (reason) {
    setError(toMessage(reason))
    throw reason
  } finally {
    setBusy(false)
  }
}

function toMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Zetro Git delivery is unavailable.'
}
