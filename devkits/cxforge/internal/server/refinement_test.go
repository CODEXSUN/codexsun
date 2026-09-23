package server

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestPreviewNeverServesCheckoutFiles(t *testing.T) {
	config := testConfig(t)
	app := New(config)
	root := taskRepository(config, "")
	os.MkdirAll(root, 0700)
	os.WriteFile(filepath.Join(root, "index.html"), []byte("private-source"), 0600)
	os.WriteFile(filepath.Join(root, ".env"), []byte("SECRET=private-secret"), 0600)
	app.store.tasks["preview-test"] = Task{ID: "preview-test"}
	for _, path := range []string{"/preview/preview-test/", "/preview/preview-test/.env"} {
		response := httptest.NewRecorder()
		app.PreviewHandler().ServeHTTP(response, httptest.NewRequest("GET", path, nil))
		if response.Code != 503 || strings.Contains(response.Body.String(), "private-") {
			t.Fatalf("preview exposed checkout: %d", response.Code)
		}
	}
}

func TestCommandEnvironmentAndIncrementalOutput(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, ".env"), []byte("APP_NAME=demo\nAPI_TOKEN=super-secret-token\n"), 0600); err != nil {
		t.Fatal(err)
	}
	environment, err := commandEnvironment(root, root)
	if err != nil {
		t.Fatal(err)
	}
	var updates []string
	result := executeToolProcessWithEnvironment(context.Background(), root, ToolStep{
		Argv:           []string{"sh", "-c", "printf '%s %s many more visible output characters here\n' \"$APP_NAME\" \"$API_TOKEN\"; sleep 2"},
		TimeoutSeconds: 10,
	}, environment, func(output string) { updates = append(updates, output) })
	if result.ExitCode != 0 || len(updates) == 0 || !strings.Contains(updates[0], "demo") || strings.Contains(updates[0], "super-secret-token") {
		t.Fatalf("environment/stream failed: %v", updates)
	}
}

func TestToolsRejectLegacyCreate(t *testing.T) {
	config := testConfig(t)
	config.ExecutionMode = "tools"
	app := New(config)
	request := httptest.NewRequest("POST", "/api/v1/cxforge/control/tasks", strings.NewReader("{}"))
	request.Header.Set("X-CXForge-Client-Key", config.ClientKey)
	response := httptest.NewRecorder()
	app.Handler().ServeHTTP(response, request)
	if response.Code != 410 {
		t.Fatalf("legacy create status %d", response.Code)
	}
}

func TestPreviewLoadsProjectEnvironmentForCommands(t *testing.T) {
	if os.Getenv("CXFORGE_ENV_PREVIEW_HELPER") == "1" {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		_ = http.ListenAndServe(fmt.Sprintf("127.0.0.1:%d", port), http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte("ready"))
		}))
		return
	}
	config := testConfig(t)
	app := New(config)
	repository := taskRepository(config, "")
	if err := os.WriteFile(filepath.Join(repository, ".env"), []byte("PREVIEW_VALUE=workspace-value\n"), 0600); err != nil {
		t.Fatal(err)
	}
	task := Task{ID: "preview-environment", Title: "Preview", Status: "review"}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	command := fmt.Sprintf("test \"$PREVIEW_VALUE\" = workspace-value && CXFORGE_ENV_PREVIEW_HELPER=1 %q -test.run=TestPreviewLoadsProjectEnvironmentForCommands", os.Args[0])
	updated, err := app.startPreview(ctx, task, repository, command)
	if err != nil {
		t.Fatal(err)
	}
	defer app.store.previews[updated.ID]()
}
