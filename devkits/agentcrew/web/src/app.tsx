import { useEffect, useState } from "react";
import { MainWorkspace } from "@codexsun/ui/layouts/main-workspace";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { request, type Event, type Run, type Status, type Task } from "./api";

export function App() {
  const [token, setToken] = useState("");
  const [connectedToken, setConnectedToken] = useState("");
  const [status, setStatus] = useState<Status>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [skill, setSkill] = useState("coding");
  const [think, setThink] = useState(false);
  const [rag, setRag] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [note, setNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!connectedToken) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const [data, log] = await Promise.all([
          request<{ tasks: Task[]; runs: Run[] }>(connectedToken, "/tasks"),
          request<{ items: Event[] }>(connectedToken, "/logs"),
        ]);
        if (!cancelled) {
          setTasks(data.tasks);
          setRuns(data.runs);
          setEvents(log.items);
        }
      } catch (cause) {
        if (!cancelled) setError(String(cause));
      }
      if (!cancelled) timer = setTimeout(refresh, 3000);
    }
    void refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [connectedToken]);

  async function act(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    setTasks([]);
    setRuns([]);
    setEvents([]);
    setConnectedToken("");
    setStatus(undefined);
    const result = await request<Status>(token, "/status");
    setStatus(result);
    setConnectedToken(token);
  }

  async function createTask() {
    const task = await request<Task>(connectedToken, "/tasks", {
      title: title || prompt.slice(0, 80),
      prompt,
      skill,
      think,
      rag,
      intervalMinutes: repeat ? 30 : null,
      maxRuns: repeat ? 4 : 1,
    });
    setTasks((current) => [task, ...current]);
    if (!repeat) await request(connectedToken, `/tasks/${task.id}/run`, {});
    setPrompt("");
    setTitle("");
    setMessage(
      repeat
        ? "Schedule saved paused. Enable it after review: every 30 minutes, at most four runs."
        : "Task queued. The answer will appear below.",
    );
  }

  return (
    <MainWorkspace
      applicationId="agentcrew"
      applicationName="AgentCrew"
      workspaceTitle="Local assistant"
      navigation={[]}
      showTopologyTools={false}
      statusLabel={connectedToken ? "API connected · local workspace" : "Disconnected"}
    >
      <main className={`crew ${compact ? "compact" : ""}`}>
        <header>
          <p className="eyebrow">LOCAL INTELLIGENCE</p>
          <h1>Your work, with context.</h1>
          <p>Qwen reasoning, private notes, and repeatable prompts. You stay in control.</p>
        </header>
        <section aria-label="Connection" className="connection">
          <label>
            Local access token
            <Input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter your configured token"
            />
          </label>
          <Button disabled={busy || !token} onClick={() => void act(connect)}>
            {connectedToken ? "Check connection" : "Connect"}
          </Button>
          {connectedToken && (
            <Button
              variant="outline"
              onClick={() => {
                setConnectedToken("");
                setToken("");
                setStatus(undefined);
                setTasks([]);
                setRuns([]);
                setEvents([]);
              }}
            >
              Disconnect
            </Button>
          )}
        </section>
        <div className="signals" aria-live="polite">
          <span className={status?.ollama ? "ok" : ""}>
            Ollama: {status ? (status.ollama ? "online" : "offline") : "not checked"}
          </span>
          <span className={status?.qdrant ? "ok" : ""}>
            Qdrant: {status ? (status.qdrant ? "online" : "offline") : "not checked"}
          </span>
          <span>
            {status ? `${status.model}: ${status.modelReady ? "installed" : "needs download"}` : "Model not checked"}
          </span>
          <span>Embeddings: {status?.embeddingsReady ? "installed" : "not ready"}</span>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}{" "}
            <Button variant="outline" disabled={busy} onClick={() => void act(connect)}>
              Retry connection
            </Button>
          </p>
        )}
        {message && (
          <p role="status" className="ok">
            {message}
          </p>
        )}
        <div className="columns">
          <section>
            <h2>Ask or plan work</h2>
            <p>Answers suggest code and actions. This assistant cannot execute shell commands or edit files.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void act(createTask);
              }}
            >
              <label>
                Task title
                <Input
                  value={title}
                  maxLength={100}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Review the login flow"
                />
              </label>
              <label>
                Prompt
                <Textarea
                  required
                  maxLength={12000}
                  rows={6}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the task, constraints, and expected result…"
                />
              </label>
              <label>
                Skill
                <select value={skill} onChange={(event) => setSkill(event.target.value)}>
                  <option value="coding">Coding advisor</option>
                  <option value="personal">Personal assistant</option>
                </select>
              </label>
              <div className="options">
                <label>
                  <input type="checkbox" checked={think} onChange={(event) => setThink(event.target.checked)} /> Reason
                  deeply (slower)
                </label>
                <label>
                  <input type="checkbox" checked={rag} onChange={(event) => setRag(event.target.checked)} /> Retrieve
                  notes
                </label>
                <label>
                  <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />{" "}
                  Repeat every 30 minutes, four runs
                </label>
              </div>
              <Button type="submit" disabled={busy || !connectedToken || !prompt.trim()}>
                {busy ? "Working…" : repeat ? "Save paused schedule" : "Send task"}
              </Button>
            </form>
          </section>
          <section>
            <h2>Knowledge shelf</h2>
            <p>Add approved notes. Retrieval selects up to four relevant chunks; identical notes are deduplicated.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void act(async () => {
                  const result = await request<{ chunks: number }>(connectedToken, "/knowledge", {
                    title: noteTitle,
                    text: note,
                  });
                  setMessage(`Indexed ${result.chunks} chunks.`);
                  setNote("");
                  setNoteTitle("");
                });
              }}
            >
              <label>
                Note title
                <Input
                  required
                  maxLength={120}
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                />
              </label>
              <label>
                Approved context
                <Textarea
                  required
                  maxLength={24000}
                  rows={6}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <Button variant="outline" type="submit" disabled={busy || !connectedToken}>
                Index note
              </Button>
            </form>
          </section>
        </div>
        <section>
          <h2>Task activity</h2>
          {!tasks.length && <p>No tasks yet. Connect and send your first prompt.</p>}
          {tasks.map((task) => (
            <article key={task.id}>
              <div className="task-heading">
                <div>
                  <h3>{task.title}</h3>
                  <p>
                    {task.skill} · {task.enabled ? "Schedule enabled" : "Manual / paused"} · {task.count} runs
                  </p>
                </div>
                <div className="actions">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        await request(connectedToken, `/tasks/${task.id}/run`, {});
                        setMessage("Run queued (active tasks are not duplicated).");
                      })
                    }
                  >
                    Run / retry
                  </Button>
                  {task.intervalMinutes && (
                    <Button
                      variant="outline"
                      disabled={busy || task.enabled}
                      onClick={() =>
                        void act(async () => {
                          await request(connectedToken, `/tasks/${task.id}/enable`, {});
                          setMessage("Schedule enabled within its run budget.");
                        })
                      }
                    >
                      Enable schedule
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        await request(connectedToken, `/tasks/${task.id}/pause`, {});
                        setMessage("Task paused; active request cancelled.");
                      })
                    }
                  >
                    Pause
                  </Button>
                </div>
              </div>
              {runs
                .filter((run) => run.taskId === task.id)
                .slice(0, 3)
                .map((run) => (
                  <div className="run" key={run.id}>
                    <strong className={run.status === "completed" ? "ok" : ""}>{run.status}</strong>
                    <span> · {new Date(run.startedAt).toLocaleTimeString()}</span>
                    <pre>{run.answer || run.error || "Generating an answer…"}</pre>
                  </div>
                ))}
            </article>
          ))}
        </section>
        <section>
          <h2>Operational log</h2>
          <p>Prompt and token contents are excluded from these events.</p>
          <ol className="logs">
            {events.slice(0, 20).map((event) => (
              <li key={event.id}>
                <time>{new Date(event.at).toLocaleTimeString()}</time>
                <span>{event.event}</span>
              </li>
            ))}
          </ol>
        </section>
        <aside className="tweak">
          <label>
            <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /> Compact
            layout
          </label>
        </aside>
      </main>
    </MainWorkspace>
  );
}
