package server

import (
	"context"
	"errors"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

type WorkspaceSetup struct {
	Preset         string           `json:"preset,omitempty"`
	Repository     *repositoryInput `json:"repository,omitempty"`
	EnvironmentRef string           `json:"environmentRef,omitempty"`
	Directory      string           `json:"directory"`
	DatabaseDriver string           `json:"databaseDriver"`
	SQLitePath     string           `json:"sqlitePath,omitempty"`
}

type setupRequest struct {
	RequestID string `json:"requestId"`
	Title     string `json:"title"`
	WorkspaceSetup
	Approved        bool              `json:"approved"`
	Install         ToolStep          `json:"install"`
	MigrationStatus ToolStep          `json:"migrationStatus"`
	Migrate         ToolStep          `json:"migrate"`
	MigrationVerify ToolStep          `json:"migrationVerify"`
	PreviewCommand  string            `json:"previewCommand"`
	Environment     map[string]string `json:"environment,omitempty"`
}

func (app *App) submitWorkspaceSetup(w http.ResponseWriter, r *http.Request) {
	var input setupRequest
	if err := decode(w, r, &input); err != nil {
		jsonError(w, 400, err)
		return
	}
	if input.Preset != "" && input.Preset != "zuno" {
		jsonError(w, 400, errors.New("unknown setup preset"))
		return
	}
	if app.config.ExecutionMode != "tools" || !input.Approved || !commandID.MatchString(input.RequestID) || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.PreviewCommand) == "" {
		jsonError(w, 400, errors.New("tools mode, approval, requestId, title and previewCommand required"))
		return
	}
	if input.DatabaseDriver == "" {
		input.DatabaseDriver = "sqlite"
	}
	if input.DatabaseDriver != "sqlite" && input.DatabaseDriver != "mariadb" && input.DatabaseDriver != "none" {
		jsonError(w, 400, errors.New("databaseDriver must be sqlite, mariadb or none"))
		return
	}
	if input.Directory == "" {
		input.Directory = "."
	}
	if input.SQLitePath == "" {
		input.SQLitePath = ".cxforge/workspace.sqlite"
	}
	if (input.Directory != "." && !safeRelativePath(input.Directory)) || !safeRelativePath(input.SQLitePath) {
		jsonError(w, 400, errors.New("setup paths must be checkout-relative"))
		return
	}
	steps := []ToolStep{input.Install, input.MigrationStatus, input.Migrate, input.MigrationVerify}
	names := []string{"install", "migration-status", "migrate", "migration-verify"}
	if input.DatabaseDriver == "none" {
		steps, names = steps[:1], names[:1]
	}
	for i := range steps {
		if len(steps[i].Argv) == 0 || steps[i].Argv[0] == "" || steps[i].TimeoutSeconds < 1 || steps[i].TimeoutSeconds > 300 {
			jsonError(w, 400, errors.New("required setup commands need argv and a 1-300 second timeout"))
			return
		}
		steps[i].Name, steps[i].Directory = names[i], input.Directory
	}
	if input.EnvironmentRef != "" {
		jsonError(w, 400, errors.New("environmentRef is server-owned"))
		return
	}
	if input.Repository != nil && !validBranch(input.Repository.DefaultBranch) {
		jsonError(w, 400, errors.New("valid defaultBranch required"))
		return
	}
	ref, err := app.saveSetupEnvironment(input.Environment)
	if err != nil {
		jsonError(w, 400, err)
		return
	}
	input.EnvironmentRef = ref
	plan := ToolPlan{RequestID: input.RequestID, Title: input.Title, Steps: steps, Setup: &input.WorkspaceSetup, PreviewCommand: input.PreviewCommand}
	app.queueToolPlan(w, plan)
}

func (app *App) prepareWorkspaceSetup(ctx context.Context, task Task, repository string) ([]string, error) {
	setup := task.Tools.Setup
	if err := excludeSetupFiles(repository); err != nil {
		return nil, err
	}
	if setup.Preset == "zuno" {
		if err := installZunoPreset(repository); err != nil {
			return nil, err
		}
	}
	directory, err := resolveSetupDirectory(repository, setup.Directory)
	if err != nil {
		return nil, err
	}
	if err := app.stopWorkspacePreviews(ctx); err != nil {
		return nil, err
	}
	app.emitEvent(task.ID, "setup.configure", "running", "Preparing project environment without overwriting existing values.")
	defaults, err := app.loadSetupEnvironment(setup.EnvironmentRef)
	if err != nil {
		return nil, err
	}
	defaults["DB_DRIVER"] = setup.DatabaseDriver
	defaults["npm_config_cache"] = filepath.Join(filepath.Dir(app.config.StatePath), "cache", "npm")
	if setup.DatabaseDriver == "sqlite" {
		path, err := resolveSQLitePath(directory, setup.SQLitePath)
		if err != nil {
			return nil, err
		}
		defaults["CXFORGE_SQLITE_PATH"] = path
	}
	if err := updateProjectEnvironment(directory, defaults, false); err != nil {
		return nil, err
	}
	environment, err := projectEnvironment(directory)
	if err != nil {
		return nil, err
	}
	values := environmentValues(environment)
	if values["DB_DRIVER"] != setup.DatabaseDriver || (setup.DatabaseDriver == "sqlite" && values["CXFORGE_SQLITE_PATH"] != defaults["CXFORGE_SQLITE_PATH"]) {
		return nil, errors.New("existing database configuration differs; update it explicitly before setup")
	}
	app.emitEvent(task.ID, "setup.database", "running", "Checking "+setup.DatabaseDriver+" connection.")
	if err := checkWorkspaceDatabase(ctx, environment); err != nil {
		return nil, err
	}
	return environment, nil
}

func (app *App) stopWorkspacePreviews(ctx context.Context) error {
	app.store.RLock()
	for _, cancel := range app.store.previews {
		cancel()
	}
	app.store.RUnlock()
	deadline := time.NewTimer(10 * time.Second)
	defer deadline.Stop()
	ticker := time.NewTicker(50 * time.Millisecond)
	defer ticker.Stop()
	for {
		app.store.RLock()
		count := len(app.store.previews)
		app.store.RUnlock()
		if count == 0 {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-deadline.C:
			return errors.New("previous preview did not stop")
		case <-ticker.C:
		}
	}
}

func resolveSetupDirectory(repository, directory string) (string, error) {
	resolved, err := filepath.EvalSymlinks(filepath.Join(repository, directory))
	if err != nil || !within(repository, resolved) {
		return "", errors.New("setup directory is unavailable or outside checkout")
	}
	return resolved, nil
}
