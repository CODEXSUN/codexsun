package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestAgentLoopRevisesAfterVerificationFailure(t *testing.T) {
	var calls atomic.Int32
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		content := "wrong"
		if calls.Add(1) > 1 {
			content = "after"
		}
		structured, _ := json.Marshal(modelOutput{Summary: "revision", Files: []modelFile{{Path: "src/app.txt", Content: content}}})
		response, _ := json.Marshal(map[string]any{
			"status": "completed",
			"usage":  map[string]int{"input_tokens": 10, "output_tokens": 5},
			"output": []any{map[string]any{"type": "message", "content": []any{map[string]string{"type": "output_text", "text": string(structured)}}}},
		})
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(response)
	}))
	defer provider.Close()

	config, task := modelTestRepository(t, provider.URL)
	config.MaxAgentTurns = 2
	config.TestCommand = "grep -q after src/app.txt"
	config.InputPricePerMillion = 2
	config.OutputPricePerMillion = 10
	app := New(config)
	app.store.tasks[task.ID] = task
	app.store.artifacts[task.ID+":workspace"] = Artifact{ID: task.ID + ":workspace", Status: "pending"}
	app.execute(task)

	result := app.store.tasks[task.ID]
	if result.Status != "review" || result.AgentTurns != 2 || calls.Load() != 2 {
		t.Fatalf("expected two-turn review, calls=%d task=%#v", calls.Load(), result)
	}
	if result.InputTokens != 20 || result.OutputTokens != 10 || result.EstimatedCostUSD <= 0 {
		t.Fatalf("expected usage and cost, got %#v", result)
	}
	if len(app.store.events[result.ID]) < 5 || app.store.metrics.ModelRequests != 2 {
		t.Fatalf("expected events and metrics, got %#v %#v", app.store.events[result.ID], app.store.metrics)
	}
}

func TestPreviewSupervisorProxiesApplication(t *testing.T) {
	if os.Getenv("CXFORGE_PREVIEW_HELPER") == "1" {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		_ = http.ListenAndServe(fmt.Sprintf("127.0.0.1:%d", port), http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte("live preview"))
		}))
		return
	}
	config := testConfig(t)
	config.PreviewCommand = fmt.Sprintf("CXFORGE_PREVIEW_HELPER=1 %q -test.run=TestPreviewSupervisorProxiesApplication", os.Args[0])
	app := New(config)
	task := Task{ID: "preview-task", Title: "Preview", Status: "review"}
	app.store.tasks[task.ID] = task
	repository := taskRepository(config, task.ID)
	if err := os.MkdirAll(repository, 0o755); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	updated, err := app.startPreview(ctx, task, repository, config.PreviewCommand)
	if err != nil {
		t.Fatal(err)
	}
	app.updateTaskPreview(updated)

	request := httptest.NewRequest(http.MethodGet, "/preview/preview-task/", nil)
	response := httptest.NewRecorder()
	app.PreviewHandler().ServeHTTP(response, request)
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "live preview") {
		t.Fatalf("unexpected preview response: %d %s", response.Code, response.Body.String())
	}
	app.store.previews[task.ID]()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		app.store.RLock()
		_, running := app.store.previews[task.ID]
		app.store.RUnlock()
		if !running {
			break
		}
		time.Sleep(25 * time.Millisecond)
	}
}

func TestGitHubRepositoryParsing(t *testing.T) {
	for _, remote := range []string{"https://github.com/acme/product.git", "git@github.com:acme/product.git", "ssh://git@github.com/acme/product.git"} {
		owner, repository, ok := githubRepository(remote)
		if !ok || owner != "acme" || repository != "product" {
			t.Fatalf("could not parse %q", remote)
		}
	}
	if _, _, ok := githubRepository("https://example.com/acme/product.git"); ok {
		t.Fatal("non-GitHub remote was accepted")
	}
}

func TestGitHubPullRequestTransport(t *testing.T) {
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/repos/acme/product/pulls" || r.Header.Get("Authorization") != "Bearer git-token" {
			t.Fatalf("unexpected GitHub request: %s %#v", r.URL.Path, r.Header)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"number":42,"html_url":"https://github.com/acme/product/pull/42"}`))
	}))
	defer provider.Close()
	app := New(testConfig(t))
	app.config.GitHubAPIURL = provider.URL
	app.config.GitToken = "git-token"
	task := Task{MergeRequest: &MergeRequestDraft{Title: "Change", Description: "Details", SourceBranch: "cxforge/task", BaseBranch: "main"}}
	pullRequest, err := app.sendGitHubPullRequest(context.Background(), "acme", "product", task, "git-token")
	if err != nil || pullRequest.Number != 42 {
		t.Fatalf("unexpected pull request: %#v %v", pullRequest, err)
	}
}

func TestRestartRecoversRunningTask(t *testing.T) {
	config := testConfig(t)
	task := Task{ID: "recovered-task", Title: "Recover", Prompt: "write", Repository: "demo", OwnedPaths: []string{"result.txt"}, Status: "running"}
	state := persistedState{Tasks: map[string]Task{task.ID: task}, Artifacts: map[string]Artifact{task.ID + ":workspace": {ID: task.ID + ":workspace", Status: "pending"}}}
	content, _ := json.Marshal(state)
	if err := os.WriteFile(config.StatePath, content, 0o600); err != nil {
		t.Fatal(err)
	}
	app := New(config)
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		app.store.RLock()
		result := app.store.tasks[task.ID]
		app.store.RUnlock()
		if result.Status == "review" {
			return
		}
		if result.Status == "blocked" {
			t.Fatalf("recovered task was blocked: %s", result.Report)
		}
		time.Sleep(25 * time.Millisecond)
	}
	t.Fatal("recovered task did not complete")
}

func TestRepositoryPolicyRequiresExplicitOptIn(t *testing.T) {
	repository := t.TempDir()
	if err := os.WriteFile(filepath.Join(repository, ".cxforge.json"), []byte(`{"testCommand":"repo-test","previewCommand":"repo-preview {port}"}`), 0o644); err != nil {
		t.Fatal(err)
	}
	policy, err := loadRepositoryPolicy(repository, Config{TestCommand: "global-test", PreviewCommand: "global-preview"})
	if err != nil || policy.TestCommand != "global-test" {
		t.Fatalf("repository policy bypassed opt-in: %#v %v", policy, err)
	}
	policy, err = loadRepositoryPolicy(repository, Config{AllowRepoCommands: true})
	if err != nil || policy.TestCommand != "repo-test" || policy.PreviewCommand != "repo-preview {port}" {
		t.Fatalf("repository policy was not loaded: %#v %v", policy, err)
	}
}

func modelTestRepository(t *testing.T, providerURL string) (Config, Task) {
	t.Helper()
	config := testConfig(t)
	config.ExecutionMode = "model"
	config.OpenAIBaseURL = providerURL
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
	task := Task{ID: "production-task", Title: "Production", Prompt: "Update app", Repository: "product", OwnedPaths: []string{"src"}, Status: "queued"}
	return config, task
}
