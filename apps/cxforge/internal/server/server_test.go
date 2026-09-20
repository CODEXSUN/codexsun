package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestReviewTaskApprovesReviewTask(t *testing.T) {
	app := New(testConfig())
	app.store.tasks["task-1"] = Task{ID: "task-1", Title: "Review me", Status: "review", Report: "Ready for review."}

	request := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/tasks/task-1/approve", strings.NewReader("{}"))
	request.Header.Set("X-CXForge-Client-Key", "test-client-key")
	response := httptest.NewRecorder()

	app.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if app.store.tasks["task-1"].Status != "approved" {
		t.Fatalf("expected approved status, got %q", app.store.tasks["task-1"].Status)
	}
}

func TestReviewTaskRejectsNonReviewTask(t *testing.T) {
	app := New(testConfig())
	app.store.tasks["task-1"] = Task{ID: "task-1", Title: "Running task", Status: "running", Report: "Not ready."}

	request := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/tasks/task-1/reject", strings.NewReader("{}"))
	request.Header.Set("X-CXForge-Client-Key", "test-client-key")
	response := httptest.NewRecorder()

	app.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", response.Code)
	}
	if app.store.tasks["task-1"].Status != "running" {
		t.Fatalf("expected running status to remain, got %q", app.store.tasks["task-1"].Status)
	}
}

func testConfig() Config {
	return Config{
		Address:       ":0",
		ClientKey:     "test-client-key",
		ServerID:      "00000000-0000-4000-8000-000000000001",
		PreviewOrigin: "http://127.0.0.1",
		PreviewPorts:  []int{7300},
		WorkspaceRoot: "/workspace",
	}
}
