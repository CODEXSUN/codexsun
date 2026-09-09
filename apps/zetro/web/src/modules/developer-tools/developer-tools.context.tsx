import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DeveloperToolsContext } from './developer-tools.controller'
import {
  compareGitBranch,
  getGitStatus,
  getGlobalToolSettings,
  getProjectToolSettings,
  launchDeveloperTool,
  runGitAction,
  updateGlobalToolSettings,
  updateProjectToolSettings,
} from './developer-tools.services'
import type {
  EditorOption,
  GitAction,
  GitWorkspaceStatus,
  ProjectToolSettings,
  ToolSettings,
} from './developer-tools.types'

export function DeveloperToolsProvider({
  children,
  projectId,
}: {
  children: ReactNode
  projectId: string | null
}) {
  const [busy, setBusy] = useState(false)
  const [editors, setEditors] = useState<EditorOption[]>([])
  const [effective, setEffective] = useState<ToolSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [global, setGlobal] = useState<ToolSettings | null>(null)
  const [project, setProject] = useState<ProjectToolSettings | null>(null)
  const [status, setStatus] = useState<GitWorkspaceStatus | null>(null)

  const refresh = useCallback(async () => {
    if (!projectId) return
    try {
      setStatus(await getGitStatus(projectId))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }, [projectId])

  useEffect(() => {
    void getGlobalToolSettings()
      .then((result) => {
        setGlobal(result.settings)
        setEditors(result.editors)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
  }, [])

  useEffect(() => {
    setStatus(null)
    if (!projectId) return
    void Promise.all([getProjectToolSettings(projectId), getGitStatus(projectId)])
      .then(([settings, nextStatus]) => {
        setProject(settings.project)
        setEffective(settings.effective)
        setStatus(nextStatus)
        setError(null)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
  }, [projectId])

  useEffect(() => {
    if (!projectId || !effective) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, effective.autoRefreshSeconds * 1_000)
    return () => window.clearInterval(timer)
  }, [effective, projectId, refresh])

  const value = useMemo(
    () => ({
      busy,
      editors,
      effective,
      error,
      global,
      project,
      status,
      compare: async (base: string) => {
        if (!projectId) throw new Error('Select a project first.')
        return compareGitBranch(projectId, base)
      },
      launch: async (target: 'editor' | 'files' | 'terminal') => {
        if (!projectId) return
        await withBusy(setBusy, setError, () => launchDeveloperTool(projectId, target))
      },
      refresh,
      run: async (action: GitAction) => {
        if (!projectId) return
        await withBusy(setBusy, setError, async () => {
          const result = await runGitAction(projectId, action)
          setStatus(result.status)
        })
      },
      saveGlobal: async (settings: ToolSettings) => {
        await withBusy(setBusy, setError, async () => {
          const result = await updateGlobalToolSettings(settings)
          setGlobal(result.settings)
          setEditors(result.editors)
          if (project?.inheritGlobal) setEffective(result.settings)
        })
      },
      saveProject: async (settings: ProjectToolSettings) => {
        if (!projectId) return
        await withBusy(setBusy, setError, async () => {
          const result = await updateProjectToolSettings(projectId, settings)
          setProject(result.project)
          setEffective(result.effective)
        })
      },
    }),
    [busy, editors, effective, error, global, project, projectId, refresh, status],
  )

  return <DeveloperToolsContext.Provider value={value}>{children}</DeveloperToolsContext.Provider>
}

async function withBusy(
  setBusy: (value: boolean) => void,
  setError: (value: string | null) => void,
  action: () => Promise<void>,
) {
  setBusy(true)
  try {
    await action()
    setError(null)
  } catch (reason) {
    setError(toMessage(reason))
    throw reason
  } finally {
    setBusy(false)
  }
}
function toMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Zetro developer tools are unavailable.'
}
