package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestReviewTaskApprovesReviewTask(t *testing.T) {
	app := New(testConfig(t))
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
	app := New(testConfig(t))
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

func TestPrepareMergeRequestRequiresApprovedTask(t *testing.T) {
	app := New(testConfig(t))
	task := Task{ID: "task-1", Title: "Prepare review handoff", Prompt: "prepare", Repository: "demo", OwnedPaths: []string{"src/app.txt"}, Status: "queued"}
	app.store.tasks[task.ID] = task
	app.store.artifacts[task.ID+":workspace"] = Artifact{ID: task.ID + ":workspace", Status: "pending"}
	app.execute(task)
	task = app.store.tasks[task.ID]
	task.Status = "approved"
	app.store.tasks[task.ID] = task

	request := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/tasks/task-1/prepare-merge", strings.NewReader("{}"))
	request.Header.Set("X-CXForge-Client-Key", "test-client-key")
	response := httptest.NewRecorder()

	app.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	draft := app.store.tasks["task-1"].MergeRequest
	if draft == nil || draft.Title != "Prepare review handoff" || draft.BaseBranch != "main" || draft.SourceBranch != "cxforge/task-1" || draft.Status != "draft" {
		t.Fatalf("expected a merge request draft, got %#v", draft)
	}
	if app.store.artifacts["task-1:patch"].Status != "ready" {
		t.Fatal("expected a ready patch artifact")
	}
}

func TestMergeRequestMustBeRecordedBeforeMerged(t *testing.T) {
	app := New(testConfig(t))
	app.store.tasks["task-1"] = Task{ID: "task-1", Title: "Merge me", Status: "approved", MergeRequest: &MergeRequestDraft{Title: "Merge me", BaseBranch: "main", SourceBranch: "cxforge/task-1", BranchPublished: true, Status: "draft"}}

	record := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/tasks/task-1/record-merge-request", strings.NewReader(`{"provider":"github","externalId":"17","url":"https://github.com/codexsun/codexsun/pull/17"}`))
	record.Header.Set("X-CXForge-Client-Key", "test-client-key")
	recordResponse := httptest.NewRecorder()
	app.Handler().ServeHTTP(recordResponse, record)
	if recordResponse.Code != http.StatusOK || app.store.tasks["task-1"].MergeRequest.Status != "open" {
		t.Fatalf("expected an open pull request, got %d: %s", recordResponse.Code, recordResponse.Body.String())
	}

	merged := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/tasks/task-1/record-merged", strings.NewReader("{}"))
	merged.Header.Set("X-CXForge-Client-Key", "test-client-key")
	mergedResponse := httptest.NewRecorder()
	app.Handler().ServeHTTP(mergedResponse, merged)
	if mergedResponse.Code != http.StatusOK || app.store.tasks["task-1"].Status != "merged" || app.store.tasks["task-1"].MergeRequest.Status != "merged" {
		t.Fatalf("expected merged task, got %d: %s", mergedResponse.Code, mergedResponse.Body.String())
	}
}

func testConfig(t *testing.T) Config {
	t.Helper()
	workspace := t.TempDir()
	return Config{
		Address:        ":0",
		ClientKey:      "test-client-key",
		ServerID:       "00000000-0000-4000-8000-000000000001",
		PreviewOrigin:  "http://127.0.0.1",
		PreviewPorts:   []int{7300},
		WorkspaceRoot:  workspace,
		SourceRoot:     t.TempDir(),
		StatePath:      t.TempDir() + "/state.json",
		ExecutionMode:  "demo",
		CommandTimeout: 20,
	}
}
