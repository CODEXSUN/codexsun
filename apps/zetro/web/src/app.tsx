import { useEffect, useState } from 'react'
import { MdiMain, type MdiNavigationSection } from '@codexsun/ui/layouts/mdi-main'
import { Bot, MessageSquare, PanelRight, Settings, Sparkles } from 'lucide-react'
import { ChatWorkspace } from './modules/chat'
import { SettingsWorkspace } from './modules/settings'
import { TaskWorkspace } from './modules/tasks'
import { TweakPanel } from './tweak-panel'
import { usePreferences } from './use-preferences'
import { useRuntimeStatus } from './use-runtime-status'
import { zetroTopologySections } from './zetro.topology'

export function App() {
  const preferences = usePreferences()
  const runtimeStatus = useRuntimeStatus()
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isTweakOpen, setIsTweakOpen] = useState(false)
  const [taskDraft, setTaskDraft] = useState('')
  const [view, setView] = useState<'chat' | 'settings'>(() => readView())

  useEffect(() => {
    const updateView = () => setView(readView())
    window.addEventListener('hashchange', updateView)
    return () => window.removeEventListener('hashchange', updateView)
  }, [])

  function createTaskFromReply(title: string): void {
    setTaskDraft(title)
    setIsCreatingTask(true)
    preferences.setShowTasks(true)
  }

  const navigation: MdiNavigationSection[] = [
    {
      label: 'Zetro',
      items: [
        { active: view === 'chat', href: '#chat', icon: MessageSquare, label: 'Chat' },
        { active: view === 'settings', href: '#settings', icon: Settings, label: 'Settings' },
        ...(!preferences.showTasks
          ? [
              {
                icon: PanelRight,
                label: 'Show tasks',
                onSelect: () => preferences.setShowTasks(true),
              },
            ]
          : []),
      ],
    },
  ]

  return (
    <MdiMain
      applicationIcon={Bot}
      applicationId="zetro"
      applicationName="Zetro"
      navigation={navigation}
      primaryAction={{
        label: 'New chat',
        onSelect: () => {
          window.location.hash = 'chat'
        },
      }}
      searchPlaceholder="Search Zetro"
      showAppearancePanel={false}
      statusLabel={formatRuntimeStatus(runtimeStatus)}
      topologySections={zetroTopologySections}
      workspaceTitle="Zetro"
    >
      <div
        className={`zetro-app density-${preferences.density} accent-${preferences.accent} ${preferences.showTasks ? '' : 'tasks-hidden'}`}
      >
        <main className={`app-main view-${view}`}>
          {view === 'settings' ? (
            <SettingsWorkspace />
          ) : (
            <>
              <ChatWorkspace autoSpeak={preferences.autoSpeak} onCreateTask={createTaskFromReply} />
              {preferences.showTasks && (
                <TaskWorkspace
                  draftTitle={taskDraft}
                  isCreating={isCreatingTask}
                  onCloseForm={() => {
                    setIsCreatingTask(false)
                    setTaskDraft('')
                  }}
                  onOpenForm={() => setIsCreatingTask(true)}
                />
              )}
            </>
          )}
        </main>

        <div className="ambient-mark" aria-hidden="true">
          <Sparkles />
        </div>
        <TweakPanel
          accent={preferences.accent}
          autoSpeak={preferences.autoSpeak}
          density={preferences.density}
          isOpen={isTweakOpen}
          onAccentChange={preferences.setAccent}
          onAutoSpeakChange={preferences.setAutoSpeak}
          onDensityChange={preferences.setDensity}
          onOpenChange={setIsTweakOpen}
          onShowTasksChange={preferences.setShowTasks}
          showTasks={preferences.showTasks}
        />
      </div>
    </MdiMain>
  )
}

function readView(): 'chat' | 'settings' {
  return window.location.hash === '#settings' ? 'settings' : 'chat'
}

function formatRuntimeStatus(status: ReturnType<typeof useRuntimeStatus>): string {
  if (status === 'configured') return 'Codex ready'
  if (status === 'configuration-required') return 'Codex setup needed'
  if (status === 'offline') return 'API offline'
  return 'Checking Codex'
}
