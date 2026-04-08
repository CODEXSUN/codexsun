import { useState, useEffect } from "react"

import type { TaskMeta } from "./kanban-board"

interface EntityTaskWidgetProps {
  entityType: string
  entityId: string
}

export function EntityTaskWidget({ entityType, entityId }: EntityTaskWidgetProps) {
  const [tasks, setTasks] = useState<TaskMeta[]>([])
  const [templates, setTemplates] = useState<{ id: string; title: string }[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const loadJobs = async () => {
    try {
      // 1. Fetch live jobs attached strictly to this specific entity
      const tasksRes = await fetch(`/api/internal/task/headers?entityType=${entityType}&entityId=${entityId}`)
      const tasksData = await tasksRes.json()
      setTasks(tasksData.items || [])

      // 2. Load execution templates
      const tplRes = await fetch("/api/internal/task/templates")
      const tplData = await tplRes.json()
      if (tplData.items?.length > 0) {
        setTemplates(tplData.items)
        setSelectedTemplate(tplData.items[0].id)
      }
    } catch (err) {
      console.error("Failed to fetch entity jobs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [entityType, entityId])

  const handleLaunchJob = async () => {
    if (!selectedTemplate) return
    try {
      const res = await fetch("/api/internal/task/instantiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          templateId: selectedTemplate,
          entityType,
          entityId
        })
      })
      if (res.ok) {
        await loadJobs() // Refresh local list immediately
      }
    } catch (e) {
      console.error("Failed to launch contextual job", e)
    }
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse bg-slate-50 dark:bg-slate-900/50">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
        <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          Active Execution Jobs
        </h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {tasks.length} Pending
        </span>
      </div>

      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            No active jobs attached.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map(task => (
              <div key={task.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">Stage: {task.board_stage_id.replace('stage-', '')}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded shadow-sm font-medium ${
                  task.status_key === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {task.status_key === 'done' ? 'Completed' : 'Running'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
        <select 
          value={selectedTemplate}
          onChange={e => setSelectedTemplate(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded shadow-sm focus:ring-1 outline-none"
        >
          {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <button 
          onClick={handleLaunchJob}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors whitespace-nowrap"
        >
          Launch Job
        </button>
      </div>
    </div>
  )
}
