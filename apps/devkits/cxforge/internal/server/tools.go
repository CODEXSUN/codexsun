package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"strings"
	"time"
)

type ToolStep struct {
	Name           string   `json:"name,omitempty"`
	Argv           []string `json:"argv"`
	Directory      string   `json:"directory"`
	TimeoutSeconds int      `json:"timeoutSeconds"`
}

type ToolResult struct {
	Output    string `json:"output"`
	ExitCode  int    `json:"exitCode"`
	Truncated bool   `json:"truncated"`
}

type ToolPlan struct {
	Setup          *WorkspaceSetup `json:"setup,omitempty"`
	RequestID      string          `json:"requestId"`
	Title          string          `json:"title"`
	Steps          []ToolStep      `json:"steps"`
	PreviewCommand string          `json:"previewCommand,omitempty"`
	Results        []ToolResult    `json:"results,omitempty"`
}

var commandID = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$`)

func (app *App) submitCommands(w http.ResponseWriter, r *http.Request) {
	if app.config.ExecutionMode != "tools" {
		jsonError(w, 409, errors.New("command API requires tools mode"))
		return
	}
	var input ToolPlan
	if err := decode(w, r, &input); err != nil {
		jsonError(w, 400, err)
		return
	}
	if input.Setup != nil {
		jsonError(w, 400, errors.New("use the workspace setup endpoint"))
		return
	}
	if !commandID.MatchString(input.RequestID) || strings.TrimSpace(input.Title) == "" || len(input.Steps) < 1 || len(input.Steps) > 32 || len(input.Results) != 0 {
		jsonError(w, 400, errors.New("requestId, title and 1-32 steps required; results are server-owned"))
		return
	}
	for _, step := range input.Steps {
		if len(step.Argv) == 0 || step.Argv[0] == "" || step.TimeoutSeconds < 1 || step.TimeoutSeconds > 300 {
			jsonError(w, 400, errors.New("each step requires argv and timeoutSeconds from 1 to 300"))
			return
		}
		if step.Directory != "" && step.Directory != "." && !safeRelativePath(step.Directory) {
			jsonError(w, 400, errors.New("directory must remain inside checkout"))
			return
		}
	}
	app.queueToolPlan(w, input)
}

func (app *App) queueToolPlan(w http.ResponseWriter, input ToolPlan) {
	app.control.Lock()
	defer app.control.Unlock()
	app.store.Lock()
	if saved, exists := app.store.tasks[input.RequestID]; exists {
		app.store.Unlock()
		if saved.Tools == nil {
			jsonError(w, 409, errors.New("requestId already in use"))
			return
		}
		original := *saved.Tools
		original.Results = nil
		if !reflect.DeepEqual(original, input) {
			jsonError(w, 409, errors.New("requestId already used for different commands"))
			return
		}
		jsonResponse(w, 200, saved)
		return
	}
	task := Task{ID: input.RequestID, Title: input.Title, Prompt: input.Title, Repository: "workspace", Tools: &input, Status: "draft", Revision: 1, CreatedAt: time.Now().UTC().Format(time.RFC3339Nano)}
	app.store.tasks[task.ID] = task
	app.store.metrics.TasksCreated++
	app.store.Unlock()
	app.queueTask(w, task.ID)
}

func (app *App) getCommand(w http.ResponseWriter, r *http.Request) {
	app.store.RLock()
	task, exists := app.store.tasks[r.PathValue("id")]
	app.store.RUnlock()
	if !exists {
		jsonError(w, 404, errors.New("command not found"))
		return
	}
	jsonResponse(w, 200, task)
}

func (app *App) executeTools(ctx context.Context, task Task) {
	repository := taskRepository(app.config, task.ID)
	if task.Tools.Setup != nil && task.Tools.Setup.Repository != nil {
		input := task.Tools.Setup.Repository
		task.Repository, task.GitConnectionID, task.BaseBranch = input.Repository, input.GitConnectionID, input.DefaultBranch
		if _, err := app.prepareRepository(ctx, task); err != nil {
			app.finish(task, "blocked", err.Error())
			return
		}
		app.recordSetupRepository(ctx, &task)
	}
	if _, err := os.Stat(filepath.Join(repository, ".git")); err != nil {
		app.finish(task, "blocked", "Clone a repository into /workspace before executing commands.")
		return
	}
	plan := *task.Tools
	plan.Results = nil
	var environment []string
	if plan.Setup != nil {
		var err error
		environment, err = app.prepareWorkspaceSetup(ctx, task, repository)
		if err != nil {
			app.finish(task, "blocked", err.Error())
			return
		}
	}
	if origin, err := runProcess(ctx, repository, "git", "remote", "get-url", "origin"); err == nil {
		task.Repository = origin
	}
	for index, step := range plan.Steps {
		directory, err := filepath.EvalSymlinks(filepath.Join(repository, step.Directory))
		if err != nil || !within(repository, directory) {
			app.finish(task, "blocked", "Command directory is unavailable or outside checkout.")
			return
		}
		stepEnvironment := environment
		if plan.Setup == nil {
			stepEnvironment, err = commandEnvironment(repository, directory)
			if err != nil {
				app.finish(task, "blocked", "Cannot load project environment: "+err.Error())
				return
			}
		}
		app.emitEvent(task.ID, "command.started", "running", fmt.Sprintf("Step %d %s: %s", index+1, step.Name, step.Argv[0]))
		result := executeToolProcessWithEnvironment(ctx, directory, step, stepEnvironment, func(output string) {
			progress := task
			snapshot := plan
			snapshot.Results = append(append([]ToolResult(nil), plan.Results...), ToolResult{Output: output})
			progress.Tools = &snapshot
			app.updateTaskProgress(progress, fmt.Sprintf("Step %d is running.", index+1))
		})
		result.Output = redactEnvironment(result.Output, stepEnvironment)
		plan.Results = append(plan.Results, result)
		snapshot := plan
		snapshot.Results = append([]ToolResult(nil), plan.Results...)
		task.Tools = &snapshot
		task.TestOutput = result.Output
		app.updateTaskProgress(task, fmt.Sprintf("Step %d exited with %d.", index+1, result.ExitCode))
		app.emitEvent(task.ID, "command.output", "running", result.Output)
		if result.ExitCode != 0 {
			app.finish(task, "blocked", fmt.Sprintf("Step %d failed with exit code %d.", index+1, result.ExitCode))
			return
		}
	}
	if plan.Setup != nil {
		if err := checkWorkspaceDatabase(ctx, environment); err != nil {
			app.finish(task, "blocked", err.Error())
			return
		}
	}
	task.Diff = gitDiff(ctx, repository, nil)
	if plan.PreviewCommand != "" {
		var err error
		task, err = app.startPreview(ctx, task, repository, plan.PreviewCommand)
		if err != nil {
			app.finish(task, "blocked", err.Error())
			return
		}
	}
	if plan.Setup != nil {
		if plan.Setup.DatabaseDriver == "none" {
			app.finish(task, "review", "Workspace ready for coding. Installation and preview checks passed; database not requested.")
			return
		}
		app.finish(task, "review", "Workspace ready for coding. Migration verification and database checks passed.")
		return
	}
	app.finish(task, "review", "Commands completed. Review output and workspace before approval.")
}
