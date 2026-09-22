package server

import (
	"context"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestToolProcessLimitsAndExitCode(t *testing.T) {
	for _, test := range []struct {
		script    string
		code      int
		truncated bool
	}{
		{"printf hello", 0, false},
		{"exit 7", 7, false},
		{"sleep 10", 124, false},
		{"head -c 2000000 /dev/zero", 0, true},
	} {
		timeout := 15
		if test.code == 124 {
			timeout = 1
		}
		result := executeToolProcess(context.Background(), t.TempDir(), ToolStep{Argv: []string{"sh", "-c", test.script}, TimeoutSeconds: timeout})
		if result.ExitCode != test.code || result.Truncated != test.truncated || len(result.Output) > toolOutputLimit {
			t.Fatalf("unexpected result: code=%d truncated=%v length=%d", result.ExitCode, result.Truncated, len(result.Output))
		}
	}
}

func TestToolsWithoutModelWritesAndSearches(t *testing.T) {
	config := testConfig(t)
	config.ExecutionMode = "tools"
	app := New(config)
	repository := taskRepository(config, "")
	if err := os.MkdirAll(filepath.Join(repository, ".git"), 0700); err != nil {
		t.Fatal(err)
	}
	task := Task{ID: "tools-test", Status: "queued", Tools: &ToolPlan{Steps: []ToolStep{
		{Argv: []string{"sh", "-c", "printf content > file.txt"}, TimeoutSeconds: 10},
		{Argv: []string{"grep", "content", "file.txt"}, TimeoutSeconds: 10},
	}}}
	app.store.tasks[task.ID] = task
	app.execute(task)
	result := app.store.tasks[task.ID]
	if result.Status != "review" || len(result.Tools.Results) != 2 || !strings.Contains(result.Tools.Results[1].Output, "content") {
		t.Fatalf("tools failed: %#v", result)
	}
	if app.store.metrics.ModelRequests != 0 {
		t.Fatal("tools called a model")
	}
}

func TestCommandRequiresAuthentication(t *testing.T) {
	app := New(testConfig(t))
	w := httptest.NewRecorder()
	app.Handler().ServeHTTP(w, httptest.NewRequest("POST", "/api/v1/cxforge/control/commands", strings.NewReader("{}")))
	if w.Code != 401 {
		t.Fatalf("expected unauthorized, got %d", w.Code)
	}
}
