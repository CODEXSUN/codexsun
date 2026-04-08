import { useState, useEffect } from "react"
import { KanbanBoard } from "../../../../ui/src/components/blocks/kanban-board"
import type { BoardStageMeta, TaskMeta } from "../../../../ui/src/components/blocks/kanban-board"

export function TaskDashboard() {
  const [stages, setStages] = useState<BoardStageMeta[]>([])
  const [tasks, setTasks] = useState<TaskMeta[]>([])
  const [templates, setTemplates] = useState<{id: string, title: string}[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const loadBoard = async () => {
    try {
        // Fetch stages
        const stagesRes = await fetch("/api/internal/task/stages")
        const stagesData = await stagesRes.json()

        // Fetch task headers
        const tasksRes = await fetch("/api/internal/task/headers")
        const tasksData = await tasksRes.json()

        // Fetch templates
        const tplRes = await fetch("/api/internal/task/templates")
        const tplData = await tplRes.json()

        // Safe fallback for parsing stages if API hasn't seeded yet
        const parsedStages = stagesData.items?.length > 0 
          ? stagesData.items.map((s: any) => ({ ...s, title: s.title || s.id }))
          : [
              { id: "todo", title: "To Do" },
              { id: "in_progress", title: "In Progress" },
              { id: "done", title: "Done" },
            ]

        setStages(parsedStages)
        setTasks(tasksData.items || [])
        
        if (tplData.items?.length > 0) {
          setTemplates(tplData.items)
          setSelectedTemplate(tplData.items[0].id)
        }
      } catch (e) {
        console.error("Failed to load task board", e)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadBoard()
  }, [])

  const handleTaskMove = async (taskId: string, newStageId: string, newPosition: number) => {
    try {
      await fetch("/api/internal/task/headers/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          boardStageId: newStageId,
          boardPosition: newPosition,
        }),
      })
    } catch (e) {
      console.error("Failed to persist task movement", e)
    }
  }

  const handleInstantiate = async () => {
    if (!selectedTemplate) return
    try {
      const res = await fetch("/api/internal/task/instantiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate })
      })
      if (res.ok) {
        // Reload board headers so the newly instantiated task shows up
        await loadBoard()
      }
    } catch (e) {
      console.error("Failed to instantiate template", e)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-8">
        <div className="animate-pulse text-slate-500">Loading Enterprise Task Boards...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-6 bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 relative">
            Task Execution Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop universal jobs, routines, and templates across active stages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-sm"
          >
            {templates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
            ))}
          </select>
          <button 
            onClick={handleInstantiate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
          >
            + Instantiate Job
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          initialStages={stages} 
          initialTasks={tasks} 
          onTaskMove={handleTaskMove}
        />
      </div>
    </div>
  )
}
