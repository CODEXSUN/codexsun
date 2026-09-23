package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const maxTaskEvents = 500

func (app *App) startWorkers() {
	for worker := 0; worker < app.config.MaxWorkers; worker++ {
		go func() {
			for task := range app.queue {
				app.execute(task)
			}
		}()
	}
}

func (app *App) enqueue(task Task) bool {
	select {
	case app.queue <- task:
		return true
	default:
		return false
	}
}

func (app *App) recoverQueue() {
	app.store.Lock()
	var recovered []Task
	interrupted := false
	for id, task := range app.store.tasks {
		if task.Status == "running" && task.Tools != nil {
			task.Status = "blocked"
			task.Report = "Command interrupted by restart. Inspect effects before retrying. Commands are not replayed automatically."
			app.store.tasks[id] = task
			interrupted = true
			continue
		}
		if task.Status != "queued" && task.Status != "running" {
			continue
		}
		task.Status = "queued"
		task.Report = "Recovered after CXForge restart."
		app.store.tasks[id] = task
		recovered = append(recovered, task)
	}
	app.store.Unlock()
	if len(recovered) > 0 || interrupted {
		app.saveState()
	}
	for _, task := range recovered {
		if app.enqueue(task) {
			app.emitEvent(task.ID, "task.recovered", "queued", task.Report)
		}
	}
	app.store.RLock()
	var pending []string
	for id := range app.store.messages {
		pending = append(pending, id)
	}
	app.store.RUnlock()
	for _, id := range pending {
		app.scheduleFollowups(id)
	}
}

func (app *App) emitEvent(taskID, eventType, status, message string) {
	event := TaskEvent{
		ID: newID(), TaskID: taskID, Type: eventType, Status: status,
		Message: message, CreatedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}
	app.store.Lock()
	events := append(app.store.events[taskID], event)
	if len(events) > maxTaskEvents {
		events = events[len(events)-maxTaskEvents:]
	}
	app.store.events[taskID] = events
	for subscriber := range app.store.subscribers[taskID] {
		select {
		case subscriber <- event:
		default:
		}
	}
	app.store.Unlock()
	app.saveState()
}

func (app *App) taskEvents(w http.ResponseWriter, r *http.Request) {
	id, ok := parseEventPath(r.URL.Path)
	if !ok {
		jsonError(w, http.StatusNotFound, fmt.Errorf("unknown task event path"))
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonError(w, http.StatusInternalServerError, fmt.Errorf("streaming is unavailable"))
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")

	updates := make(chan TaskEvent, 16)
	app.store.Lock()
	if _, exists := app.store.tasks[id]; !exists {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, fmt.Errorf("task not found"))
		return
	}
	backlog := append([]TaskEvent(nil), app.store.events[id]...)
	if app.store.subscribers[id] == nil {
		app.store.subscribers[id] = map[chan TaskEvent]struct{}{}
	}
	app.store.subscribers[id][updates] = struct{}{}
	app.store.Unlock()
	defer app.removeSubscriber(id, updates)

	for _, event := range backlog {
		writeSSE(w, event)
	}
	flusher.Flush()
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case event := <-updates:
			writeSSE(w, event)
			flusher.Flush()
		case <-heartbeat.C:
			_, _ = fmt.Fprint(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}

func (app *App) removeSubscriber(taskID string, updates chan TaskEvent) {
	app.store.Lock()
	delete(app.store.subscribers[taskID], updates)
	app.store.Unlock()
}

func writeSSE(w http.ResponseWriter, event TaskEvent) {
	payload, _ := json.Marshal(event)
	_, _ = fmt.Fprintf(w, "id: %s\nevent: %s\ndata: %s\n\n", event.ID, event.Type, payload)
}

func parseEventPath(path string) (string, bool) {
	parts := strings.Split(strings.TrimPrefix(path, "/api/v1/cxforge/control/tasks/"), "/")
	return parts[0], len(parts) == 2 && parts[0] != "" && parts[1] == "events"
}

func (app *App) metricsHandler(w http.ResponseWriter, _ *http.Request) {
	app.store.RLock()
	metrics := app.store.metrics
	running, queued := 0, 0
	for _, task := range app.store.tasks {
		switch task.Status {
		case "running":
			running++
		case "queued":
			queued++
		}
	}
	app.store.RUnlock()
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	_, _ = fmt.Fprintf(w, "cxforge_tasks_created_total %d\n", metrics.TasksCreated)
	_, _ = fmt.Fprintf(w, "cxforge_tasks_completed_total %d\n", metrics.TasksCompleted)
	_, _ = fmt.Fprintf(w, "cxforge_tasks_blocked_total %d\n", metrics.TasksBlocked)
	_, _ = fmt.Fprintf(w, "cxforge_model_requests_total %d\n", metrics.ModelRequests)
	_, _ = fmt.Fprintf(w, "cxforge_model_input_tokens_total %d\n", metrics.InputTokens)
	_, _ = fmt.Fprintf(w, "cxforge_model_output_tokens_total %d\n", metrics.OutputTokens)
	_, _ = fmt.Fprintf(w, "cxforge_tasks_running %d\n", running)
	_, _ = fmt.Fprintf(w, "cxforge_tasks_queued %d\n", queued)
}
