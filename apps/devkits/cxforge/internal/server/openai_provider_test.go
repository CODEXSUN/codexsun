package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
)

func TestOpenAIProviderRetriesAndReturnsStructuredChanges(t *testing.T) {
	var calls atomic.Int32
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Fatalf("unexpected authorization header")
		}
		if calls.Add(1) == 1 {
			http.Error(w, "temporary", http.StatusServiceUnavailable)
			return
		}
		var request openAIRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatal(err)
		}
		if request.Model != "test-model" || request.Store || request.Text.Format.Type != "json_schema" {
			t.Fatalf("unexpected request: %#v", request)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":"{\"summary\":\"updated\",\"files\":[{\"path\":\"src/app.txt\",\"content\":\"hello\"}]}"}]}]}`))
	}))
	defer provider.Close()

	config := Config{OpenAIBaseURL: provider.URL, OpenAIAPIKey: "test-key", OpenAIModel: "test-model", ReasoningEffort: "high"}
	output, err := runOpenAIModel(context.Background(), config, modelInput{Prompt: "edit", OwnedPaths: []string{"src"}}, "snapshot")
	if err != nil {
		t.Fatal(err)
	}
	if calls.Load() != 2 || output.Summary != "updated" || len(output.Files) != 1 {
		t.Fatalf("unexpected provider output: calls=%d output=%#v", calls.Load(), output)
	}
}

func TestOpenAIProviderRequiresAPIKey(t *testing.T) {
	_, err := runOpenAIModel(context.Background(), Config{}, modelInput{}, "")
	if err == nil || !strings.Contains(err.Error(), "OPENAI_API_KEY") {
		t.Fatalf("expected API key error, got %v", err)
	}
}

func TestModelTaskClonesRepositoryAndReachesReview(t *testing.T) {
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":"{\"summary\":\"updated app\",\"files\":[{\"path\":\"src/app.txt\",\"content\":\"after\"}]}"}]}]}`))
	}))
	defer provider.Close()

	config := testConfig(t)
	config.ExecutionMode = "model"
	config.OpenAIBaseURL = provider.URL
	config.OpenAIAPIKey = "test-key"
	config.OpenAIModel = "test-model"
	config.ReasoningEffort = "high"
	source := filepath.Join(config.SourceRoot, "product")
	if err := os.MkdirAll(filepath.Join(source, "src"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(source, "src", "app.txt"), []byte("before\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if _, err := runProcess(ctx, source, "git", "init", "--initial-branch=main"); err != nil {
		t.Fatal(err)
	}
	configureGitIdentity(ctx, source)
	if _, err := runProcess(ctx, source, "git", "add", "--all"); err != nil {
		t.Fatal(err)
	}
	if _, err := runProcess(ctx, source, "git", "commit", "-m", "initial"); err != nil {
		t.Fatal(err)
	}

	app := New(config)
	task := Task{ID: "model-task", Title: "Model task", Prompt: "Update app", Repository: "product", OwnedPaths: []string{"src"}, Status: "queued"}
	app.store.tasks[task.ID] = task
	app.store.artifacts[task.ID+":workspace"] = Artifact{ID: task.ID + ":workspace", Status: "pending"}
	app.execute(task)

	result := app.store.tasks[task.ID]
	if result.Status != "review" || !strings.Contains(result.Diff, "+after") {
		t.Fatalf("expected model task in review with diff, got %#v", result)
	}
}

func TestRepositorySnapshotSkipsDependenciesAndBinaryFiles(t *testing.T) {
	repository := t.TempDir()
	if err := os.WriteFile(filepath.Join(repository, "app.go"), []byte("package main"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(repository, "node_modules", "pkg"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(repository, "node_modules", "pkg", "index.js"), []byte("skip"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(repository, "image.bin"), []byte{0, 1, 2}, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(repository, ".env"), []byte("SECRET=value"), 0o600); err != nil {
		t.Fatal(err)
	}

	snapshot, err := repositorySnapshot(repository)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(snapshot, "app.go") || strings.Contains(snapshot, "node_modules") || strings.Contains(snapshot, "image.bin") || strings.Contains(snapshot, "SECRET") {
		t.Fatalf("unexpected snapshot: %s", snapshot)
	}
}
