package server

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestApplyFilesAllowsOwnedDirectory(t *testing.T) {
	repository := t.TempDir()
	changed, err := applyFiles(repository, []string{"src"}, []modelFile{{Path: "src/app.txt", Content: "ready"}})
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 1 || changed[0] != "src/app.txt" {
		t.Fatalf("unexpected changed files: %#v", changed)
	}
	content, err := os.ReadFile(filepath.Join(repository, "src", "app.txt"))
	if err != nil || string(content) != "ready" {
		t.Fatalf("expected owned file content, got %q, %v", content, err)
	}
}

func TestApplyFilesRejectsUnownedPath(t *testing.T) {
	_, err := applyFiles(t.TempDir(), []string{"src"}, []modelFile{{Path: "secrets.txt", Content: "no"}})
	if err == nil || !strings.Contains(err.Error(), "unowned") {
		t.Fatalf("expected unowned path error, got %v", err)
	}
}

func TestRunModelUsesStructuredContract(t *testing.T) {
	command := `cat >/dev/null; printf '%s' 'diagnostic' >&2; printf '%s' '{"files":[{"path":"src/app.txt","content":"hello"}],"summary":"done"}'`
	result, err := runModel(context.Background(), command, modelInput{Prompt: "edit", OwnedPaths: []string{"src"}})
	if err != nil {
		t.Fatal(err)
	}
	if result.Summary != "done" || len(result.Files) != 1 || result.Files[0].Path != "src/app.txt" {
		t.Fatalf("unexpected model output: %#v", result)
	}
}

func TestStateSurvivesRestart(t *testing.T) {
	config := testConfig(t)
	first := New(config)
	first.store.tasks["task-1"] = Task{ID: "task-1", Title: "Persist me", Status: "review"}
	first.saveState()

	second := New(config)
	if second.store.tasks["task-1"].Title != "Persist me" {
		t.Fatalf("task was not restored: %#v", second.store.tasks)
	}
}

func TestLegacyMergeDraftGetsLifecycleDefaults(t *testing.T) {
	config := testConfig(t)
	legacy := `{"tasks":{"task-1":{"id":"task-1","title":"Legacy","status":"approved","mergeRequest":{"title":"Legacy","description":"Old draft","baseBranch":"main"}}},"artifacts":{}}`
	if err := os.WriteFile(config.StatePath, []byte(legacy), 0o600); err != nil {
		t.Fatal(err)
	}

	app := New(config)
	draft := app.store.tasks["task-1"].MergeRequest
	if draft == nil || draft.Status != "draft" || draft.SourceBranch != "cxforge/task-1" || draft.BranchPublished {
		t.Fatalf("legacy draft was not normalized safely: %#v", draft)
	}
}

func TestDemoExecutionProducesDiffAndReview(t *testing.T) {
	config := testConfig(t)
	app := New(config)
	task := Task{ID: "task-demo", Title: "Demo", Prompt: "write file", Repository: "sample", OwnedPaths: []string{"src/app.txt"}, Status: "queued"}
	app.store.tasks[task.ID] = task
	app.store.artifacts[task.ID+":workspace"] = Artifact{ID: task.ID + ":workspace", Status: "pending"}

	app.execute(task)
	result := app.store.tasks[task.ID]
	if result.Status != "review" {
		t.Fatalf("expected review, got %q: %s", result.Status, result.Report)
	}
	if !strings.Contains(result.Diff, "CXForge demo edit") {
		t.Fatalf("expected a diff for the generated file, got %q", result.Diff)
	}
}
