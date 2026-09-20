package server

import (
	"errors"
	"net/http"
	"strings"
	"time"
)

type TaskMessage struct {
	ID               string `json:"messageId"`
	Prompt           string `json:"prompt"`
	ExpectedRevision int    `json:"expectedTaskRevision"`
	Status           string `json:"status"`
	CreatedAt        string `json:"createdAt"`
}

func (app *App) initializeSingleWorkspace() {
	if app.store.messages == nil {
		app.store.messages = map[string][]TaskMessage{}
	}
	// Restore the most recent workspace owner for approval checks.
	if app.store.workspaceTaskID == "" && len(app.store.tasks) == 1 {
		for id := range app.store.tasks {
			app.store.workspaceTaskID = id
		}
	}
	for id, task := range app.store.tasks {
		if task.Revision == 0 {
			task.Revision = 1
		}
		app.store.tasks[id] = task
	}
}

func (app *App) continueTask(w http.ResponseWriter, r *http.Request, id string) {
	var message TaskMessage
	if err := decode(w, r, &message); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if message.ID == "" || strings.TrimSpace(message.Prompt) == "" {
		jsonError(w, http.StatusBadRequest, errors.New("messageId, prompt and expectedTaskRevision are required"))
		return
	}
	app.store.Lock()
	task, exists := app.store.tasks[id]
	if !exists {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	for _, saved := range app.store.messages[id] {
		if saved.ID == message.ID {
			app.store.Unlock()
			if saved.Prompt != message.Prompt {
				jsonError(w, http.StatusConflict, errors.New("messageId already used with another prompt"))
				return
			}
			jsonResponse(w, http.StatusOK, saved)
			return
		}
	}
	if task.Status == "merged" || task.Status == "completed" || task.Status == "draft" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("task cannot continue in this container"))
		return
	}
	if message.ExpectedRevision != task.Revision {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("task revision changed; refresh before submitting"))
		return
	}
	message.Status = "pending"
	message.CreatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	app.store.messages[id] = append(app.store.messages[id], message)
	busy := app.store.cancels[id] != nil || task.Status == "queued" || task.Status == "running"
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "message.accepted", task.Status, message.ID)
	if !busy {
		app.scheduleFollowups(id)
	}
	jsonResponse(w, http.StatusAccepted, message)
}

func (app *App) scheduleFollowups(id string) {
	app.store.Lock()
	task, exists := app.store.tasks[id]
	if !exists || app.store.cancels[id] != nil || task.Status == "running" || task.Status == "queued" || task.Status == "merged" || task.Status == "completed" {
		app.store.Unlock()
		return
	}
	messages := app.store.messages[id]
	var applied []string
	for index := range messages {
		if messages[index].Status != "pending" {
			continue
		}
		task.Prompt += "\n\nFollow-up instruction:\n" + messages[index].Prompt
		messages[index].Status = "applied"
		applied = append(applied, messages[index].ID)
	}
	if len(applied) == 0 {
		app.store.Unlock()
		return
	}
	task.Revision++
	task.Status = "queued"
	task.Report = "Follow-up queued in the existing workspace. Review is required again."
	app.store.tasks[id] = task
	app.store.messages[id] = messages
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "message.applied", "queued", strings.Join(applied, ","))
	if !app.enqueue(task) {
		app.finish(task, "blocked", "Worker queue is full. Retry in the same workspace.")
	}
}

func (app *App) completeTask(w http.ResponseWriter, id string) {
	if !app.workspace.TryLock() {
		jsonError(w, http.StatusConflict, errors.New("workspace is executing a command"))
		return
	}
	defer app.workspace.Unlock()
	app.store.Lock()
	task, exists := app.store.tasks[id]
	if !exists || task.Status != "approved" || app.store.cancels[id] != nil || (task.MergeRequest != nil && task.MergeRequest.Status == "open") {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("approve the finished work first; open pull requests require merge confirmation"))
		return
	}
	task.Status = "completed"
	task.Report = "Work completed. Workspace and history retained."
	app.store.tasks[id] = task
	for _, cancel := range app.store.previews {
		cancel()
	}
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "task.completed", "completed", task.Report)
	jsonResponse(w, http.StatusOK, task)
}
