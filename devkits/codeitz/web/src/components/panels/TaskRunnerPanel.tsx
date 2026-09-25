import React from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import {
  PlayIcon,
  PauseIcon,
  FastForwardIcon,
  RotateCcwIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  GitBranchIcon,
  CpuIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

interface TaskRunnerPanelProps {
  queueTab: "queue" | "scheduler" | "logs";
  setQueueTab: (tab: "queue" | "scheduler" | "logs") => void;
  runnerState: any;
  queueItems: any[];
  runnerLogs: any[];
  runnerConcurrency: number;
  setRunnerConcurrency: (concurrency: number) => void;
  onStartRunner: () => Promise<void>;
  onPauseRunner: () => Promise<void>;
  onStepRunner: () => Promise<void>;
  onStepParallel: () => Promise<void>;
  onDequeueTask: (taskId: string) => Promise<void>;
}

const PHASE_COLORS: Record<string, string> = {
  intake: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  grounding: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  planning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  execution: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  verification: "bg-green-500/20 text-green-300 border-green-500/30",
  review: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  queued: <ClockIcon className="w-4 h-4" />,
  in_progress: <PlayIcon className="w-4 h-4" />,
  paused: <PauseIcon className="w-4 h-4" />,
  completed: <CheckCircle2Icon className="w-4 h-4" />,
  failed: <XCircleIcon className="w-4 h-4" />,
};

export function TaskRunnerPanel({
  queueTab,
  setQueueTab,
  runnerState,
  queueItems,
  runnerLogs,
  runnerConcurrency,
  setRunnerConcurrency,
  onStartRunner,
  onPauseRunner,
  onStepRunner,
  onStepParallel,
  onDequeueTask,
}: TaskRunnerPanelProps) {
  const handleStart = async () => {
    try {
      await onStartRunner();
    } catch (error) {
      console.error("Failed to start runner:", error);
    }
  };

  const handlePause = async () => {
    try {
      await onPauseRunner();
    } catch (error) {
      console.error("Failed to pause runner:", error);
    }
  };

  const handleStep = async () => {
    try {
      await onStepRunner();
    } catch (error) {
      console.error("Failed to step runner:", error);
    }
  };

  const handleStepParallel = async () => {
    try {
      await onStepParallel();
    } catch (error) {
      console.error("Failed to step parallel:", error);
    }
  };

  const handleDequeue = async (taskId: string) => {
    try {
      await onDequeueTask(taskId);
    } catch (error) {
      console.error("Failed to dequeue task:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CpuIcon className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Task Runner</h3>
          <Badge variant="outline" className={`${
            runnerState?.status === "running" ? "bg-green-500/20 text-green-300 border-green-500/30" :
            runnerState?.status === "paused" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
            "bg-[#202226] text-[#8c8d8e] border-[#2a2b2e]"
          }`}>
            {runnerState?.status || "idle"}
          </Badge>
          <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
            {runnerState?.activeRunners?.length || 0} / {runnerConcurrency} active
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStep}
            disabled={runnerState?.status === "running"}
            className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e] hover:text-white"
          >
            <FastForwardIcon className="w-4 h-4 mr-2" />
            Step
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStepParallel}
            disabled={runnerState?.status === "running"}
            className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e] hover:text-white"
          >
            <CpuIcon className="w-4 h-4 mr-2" />
            Parallel
          </Button>
          {runnerState?.status === "running" ? (
            <Button
              size="sm"
              onClick={handlePause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <PauseIcon className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleStart}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Settings */}
      <Card className="bg-[#191a1c] border-[#2a2b2e]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[#8c8d8e]" />
              <span className="text-sm text-[#8c8d8e]">Concurrency:</span>
              <input
                type="number"
                min="1"
                max="8"
                value={runnerConcurrency}
                onChange={(e) => setRunnerConcurrency(parseInt(e.target.value))}
                className="w-16 px-2 py-1 rounded bg-[#121315] border border-[#2a2b2e] text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-[#8c8d8e]" />
              <span className="text-sm text-[#8c8d8e]">
                Processed: {runnerState?.processedCount || 0}
              </span>
            </div>
            {runnerState?.lastRunAt && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-[#8c8d8e]" />
                <span className="text-sm text-[#8c8d8e]">
                  Last run: {new Date(runnerState.lastRunAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setQueueTab("queue")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            queueTab === "queue"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e] hover:border-[#3a3b3f]"
          }`}
        >
          Queue ({queueItems.length})
        </button>
        <button
          onClick={() => setQueueTab("scheduler")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            queueTab === "scheduler"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e] hover:border-[#3a3b3f]"
          }`}
        >
          Scheduler
        </button>
        <button
          onClick={() => setQueueTab("logs")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            queueTab === "logs"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e] hover:border-[#3a3b3f]"
          }`}
        >
          Logs ({runnerLogs.length})
        </button>
      </div>

      {/* Queue Tab */}
      {queueTab === "queue" && (
        <div className="space-y-2">
          {queueItems.length === 0 ? (
            <Card className="bg-[#191a1c] border-[#2a2b2e]">
              <CardContent className="p-8 text-center">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-[#8c8d8e]" />
                <p className="text-[#8c8d8e]">No tasks in queue</p>
              </CardContent>
            </Card>
          ) : (
            queueItems.map((item) => (
              <Card key={item.id} className="bg-[#191a1c] border-[#2a2b2e]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {STATUS_ICONS[item.status]}
                      <Badge variant="outline" className={`${
                        PHASE_COLORS[item.currentPhase] || "bg-[#202226] text-[#8c8d8e] border-[#2a2b2e]"
                      }`}>
                        {item.currentPhase}
                      </Badge>
                      <Badge variant="outline" className={`${
                        item.priority === "critical" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                        item.priority === "high" ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                        item.priority === "medium" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                        "bg-[#202226] text-[#8c8d8e] border-[#2a2b2e]"
                      }`}>
                        {item.priority}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDequeue(item.taskId)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                  <h4 className="font-medium text-white mb-1">{item.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-[#8c8d8e]">
                    <span>ID: {item.taskId.slice(0, 8)}</span>
                    {item.projectId && <span>Project: {item.projectId}</span>}
                    <span>Enqueued: {new Date(item.enqueuedAt).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Scheduler Tab */}
      {queueTab === "scheduler" && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardContent className="p-8 text-center">
            <GitBranchIcon className="w-12 h-12 mx-auto mb-4 text-[#8c8d8e]" />
            <p className="text-[#8c8d8e]">Scheduler configuration coming soon</p>
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {queueTab === "logs" && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {runnerLogs.length === 0 ? (
            <Card className="bg-[#191a1c] border-[#2a2b2e]">
              <CardContent className="p-8 text-center">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-[#8c8d8e]" />
                <p className="text-[#8c8d8e]">No logs yet</p>
              </CardContent>
            </Card>
          ) : (
            runnerLogs.map((log, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-sm font-mono ${
                log.level === "error" ? "bg-red-500/10 text-red-300 border border-red-500/30" :
                log.level === "warn" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30" :
                "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e]"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[#8c8d8e]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {log.taskTitle && <span className="text-xs text-[#8c8d8e]">{log.taskTitle}</span>}
                  {log.phase && <Badge variant="outline" className="text-xs bg-[#202226] text-[#8c8d8e] border-[#2a2b2e]">{log.phase}</Badge>}
                </div>
                <p>{log.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
