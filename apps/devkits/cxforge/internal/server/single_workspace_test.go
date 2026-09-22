package server

import (
	"context"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSharedCheckoutPreservesFilesAcrossTasks(t *testing.T) {
	app := New(testConfig(t))
	first := Task{ID: "first", Repository: "demo"}
	checkout, err := app.prepareRepository(context.Background(), first)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(checkout, "uncommitted.txt")
	if err := os.WriteFile(path, []byte("keep this work"), 0600); err != nil {
		t.Fatal(err)
	}
	second, err := app.prepareRepository(context.Background(), Task{ID: "second", Repository: "demo"})
	if err != nil {
		t.Fatal(err)
	}
	if second != checkout {
		t.Fatal("tasks must share one checkout")
	}
	content, err := os.ReadFile(path)
	if err != nil || string(content) != "keep this work" {
		t.Fatal("existing edits were lost")
	}
	if app.config.MaxWorkers != 1 {
		t.Fatal("workspace must have one executor")
	}
}

func TestFollowupIsIdempotentAndChecksRevision(t *testing.T) {
	app := New(testConfig(t))
	app.store.tasks["first"] = Task{ID: "first", Status: "running", Revision: 2}
	send := func(body string) int {
		response := httptest.NewRecorder()
		app.continueTask(response, httptest.NewRequest("POST", "/", strings.NewReader(body)), "first")
		return response.Code
	}
	body := `{"messageId":"m1","prompt":"test the changes","expectedTaskRevision":2}`
	if send(body) != 202 || send(body) != 200 {
		t.Fatal("duplicate must be idempotent")
	}
	if send(`{"messageId":"m2","prompt":"fix","expectedTaskRevision":1}`) != 409 {
		t.Fatal("stale revision accepted")
	}
	if len(app.store.messages["first"]) != 1 {
		t.Fatal("duplicate was queued")
	}
	app.store.Lock()
	task := app.store.tasks["first"]
	task.Status = "review"
	app.store.tasks["first"] = task
	app.store.Unlock()
	// Verify pending state survives persistence before the executor consumes it.
	app.saveState()
	if app.store.messages["first"][0].Status != "pending" {
		t.Fatal("running task consumed followup early")
	}
}

func TestCancelledQueueEntryDoesNotExecute(t *testing.T) {
	app := New(testConfig(t))
	task := Task{ID: "cancelled", Status: "cancelled"}
	app.store.tasks[task.ID] = task
	app.execute(task)
	if app.store.tasks[task.ID].Status != "cancelled" {
		t.Fatal("cancelled task executed")
	}
}
