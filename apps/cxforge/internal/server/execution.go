package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type modelInput struct {
	Prompt     string   `json:"prompt"`
	Repository string   `json:"repository"`
	OwnedPaths []string `json:"ownedPaths"`
}

type modelFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type modelOutput struct {
	Summary      string      `json:"summary"`
	Files        []modelFile `json:"files"`
	InputTokens  int         `json:"-"`
	OutputTokens int         `json:"-"`
}

func (app *App) execute(task Task) {
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	app.store.Lock()
	task.Status, task.Report = "running", "Preparing isolated workspace."
	app.store.tasks[task.ID] = task
	app.store.cancels[task.ID] = cancel
	app.store.Unlock()
	app.saveState()
	app.emitEvent(task.ID, "task.running", "running", task.Report)
	defer app.clearCancellation(task.ID, cancel)

	repository, err := app.prepareRepository(ctx, task)
	if err != nil {
		app.finish(task, "blocked", err.Error())
		return
	}

	app.emitEvent(task.ID, "workspace.ready", "running", "Isolated Git workspace is ready.")
	policy, err := loadRepositoryPolicy(repository, app.config)
	if err != nil {
		app.finish(task, "blocked", err.Error())
		return
	}
	app.runAgentLoop(ctx, task, repository, policy)
}

func (app *App) runAgentLoop(ctx context.Context, task Task, repository string, policy repositoryPolicy) {
	changedSet := map[string]bool{}
	feedback := ""
	for turn := 1; turn <= app.config.MaxAgentTurns; turn++ {
		if ctx.Err() != nil {
			app.finish(task, "blocked", "Execution cancelled or timed out.")
			return
		}
		turnTask := task
		turnTask.Prompt = agentPrompt(task.Prompt, feedback, turn, app.config.MaxAgentTurns)
		app.emitEvent(task.ID, "agent.turn.started", "running", fmt.Sprintf("Agent turn %d started.", turn))
		changed, summary, usage, err := app.runTask(ctx, turnTask, repository)
		if err != nil {
			app.finish(task, "blocked", err.Error())
			return
		}
		for _, path := range changed {
			changedSet[path] = true
		}
		task.AgentTurns = turn
		task.InputTokens += usage.InputTokens
		task.OutputTokens += usage.OutputTokens
		app.recordModelUsage(usage)

		testOutput, testErr := runCommand(ctx, policy.TestCommand, repository)
		task.ChangedFiles = sortedPaths(changedSet)
		task.TestOutput = testOutput
		task.Diff = gitDiff(ctx, repository, task.ChangedFiles)
		task.EstimatedCostUSD = estimateCost(task.InputTokens, task.OutputTokens, app.config)
		app.updateTaskProgress(task, fmt.Sprintf("Agent turn %d completed.", turn))
		if testErr == nil {
			previewTask, previewErr := app.startPreview(ctx, task, repository, policy.PreviewCommand)
			if previewErr != nil {
				app.emitEvent(task.ID, "preview.failed", "running", previewErr.Error())
			} else {
				task = previewTask
			}
			app.finish(task, "review", summary+" Verification completed.")
			return
		}
		feedback = "The verification command failed. Diagnose and revise the owned files.\n\nVerification output:\n" + testOutput
		app.emitEvent(task.ID, "verification.failed", "running", fmt.Sprintf("Turn %d verification failed. Revision requested.", turn))
	}
	app.finish(task, "blocked", fmt.Sprintf("Verification failed after %d agent turns.", app.config.MaxAgentTurns))
}

func agentPrompt(original, feedback string, turn, maximum int) string {
	prompt := fmt.Sprintf("%s\n\nThis is agent turn %d of %d.", original, turn, maximum)
	if feedback != "" {
		prompt += "\n\n" + feedback
	}
	return prompt
}

func (app *App) updateTaskProgress(task Task, report string) {
	app.store.Lock()
	current := app.store.tasks[task.ID]
	if current.Status != "blocked" {
		task.Status = "running"
		task.Report = report
		app.store.tasks[task.ID] = task
	}
	app.store.Unlock()
	app.saveState()
}

func (app *App) recordModelUsage(usage modelOutput) {
	if usage.InputTokens == 0 && usage.OutputTokens == 0 && app.config.ExecutionMode == "demo" {
		return
	}
	app.store.Lock()
	app.store.metrics.ModelRequests++
	app.store.metrics.InputTokens += uint64(usage.InputTokens)
	app.store.metrics.OutputTokens += uint64(usage.OutputTokens)
	app.store.Unlock()
}

func estimateCost(inputTokens, outputTokens int, config Config) float64 {
	return float64(inputTokens)*config.InputPricePerMillion/1_000_000 + float64(outputTokens)*config.OutputPricePerMillion/1_000_000
}

func sortedPaths(paths map[string]bool) []string {
	result := make([]string, 0, len(paths))
	for path := range paths {
		result = append(result, path)
	}
	sort.Strings(result)
	return result
}

func (app *App) prepareRepository(ctx context.Context, task Task) (string, error) {
	config := app.config
	taskRoot := filepath.Join(config.WorkspaceRoot, task.ID)
	destination := taskRepository(config, task.ID)
	if !within(config.WorkspaceRoot, destination) {
		return "", errors.New("task workspace is outside the workspace root")
	}
	if err := os.RemoveAll(destination); err != nil {
		return "", fmt.Errorf("could not reset workspace: %w", err)
	}
	if err := os.MkdirAll(taskRoot, 0o755); err != nil {
		return "", fmt.Errorf("could not prepare workspace: %w", err)
	}
	if config.ExecutionMode == "demo" {
		if err := os.MkdirAll(destination, 0o755); err != nil {
			return "", fmt.Errorf("could not prepare demo repository: %w", err)
		}
		if _, err := runProcess(ctx, destination, "git", "init", "--initial-branch=main"); err != nil {
			return "", fmt.Errorf("could not initialize demo repository: %w", err)
		}
		configureGitIdentity(ctx, destination)
		if _, err := runProcess(ctx, destination, "git", "commit", "--allow-empty", "-m", "Initialize CXForge workspace"); err != nil {
			return "", fmt.Errorf("could not initialize demo history: %w", err)
		}
		return destination, nil
	}

	source, err := repositorySource(config.SourceRoot, task.Repository)
	if err != nil {
		return "", err
	}
	if !isNetworkRepository(source) {
		if _, err := runProcess(ctx, taskRoot, "git", "clone", "--no-hardlinks", "--", source, destination); err != nil {
			return "", fmt.Errorf("could not clone repository: %w", err)
		}
		configureGitIdentity(ctx, destination)
		return destination, nil
	}
	access, err := app.taskGitAccess(task, "clone")
	if err != nil {
		return "", err
	}
	if _, err := runGitProcess(ctx, taskRoot, access, "clone", "--no-hardlinks", "--", source, destination); err != nil {
		return "", fmt.Errorf("could not clone repository: %w", err)
	}
	configureGitIdentity(ctx, destination)
	return destination, nil
}

func (app *App) prepareMergeBranch(task Task) (string, bool, error) {
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	defer cancel()
	repository := taskRepository(app.config, task.ID)
	branch := "cxforge/" + task.ID
	if _, err := runProcess(ctx, repository, "git", "switch", "-c", branch); err != nil {
		return "", false, fmt.Errorf("could not create merge branch: %w", err)
	}
	if _, err := runProcess(ctx, repository, "git", "add", "--all"); err != nil {
		return "", false, fmt.Errorf("could not stage worker changes: %w", err)
	}
	if _, err := runProcess(ctx, repository, "git", "commit", "-m", task.Title); err != nil {
		return "", false, fmt.Errorf("could not commit worker changes: %w", err)
	}
	remote, err := runProcess(ctx, repository, "git", "remote", "get-url", "origin")
	if err != nil || !isNetworkRepository(remote) {
		return branch, false, nil
	}
	access, err := app.taskGitAccess(task, "push")
	if err != nil {
		return "", false, err
	}
	if err := pushBranch(ctx, repository, branch, access); err != nil {
		return "", false, fmt.Errorf("could not publish merge branch: %w", err)
	}
	return branch, true, nil
}

func pushBranch(ctx context.Context, repository, branch string, access gitAccess) error {
	process := exec.CommandContext(ctx, "git", "push", "--set-upstream", "origin", branch)
	process.Dir = repository
	process.Env = gitEnvironment(access)
	output, err := process.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %w", strings.TrimSpace(string(output)), err)
	}
	return nil
}

func runGitProcess(ctx context.Context, directory string, access gitAccess, args ...string) (string, error) {
	process := exec.CommandContext(ctx, "git", args...)
	process.Dir = directory
	process.Env = gitEnvironment(access)
	output, err := process.CombinedOutput()
	text := strings.TrimSpace(string(output))
	if err != nil {
		return text, fmt.Errorf("%s: %w", text, err)
	}
	return text, nil
}

func configureGitIdentity(ctx context.Context, repository string) {
	_, _ = runProcess(ctx, repository, "git", "config", "user.name", "CXForge Worker")
	_, _ = runProcess(ctx, repository, "git", "config", "user.email", "cxforge@localhost")
}

func isNetworkRepository(repository string) bool {
	return strings.Contains(repository, "://") || strings.HasPrefix(repository, "git@")
}

func repositorySource(sourceRoot, repository string) (string, error) {
	repository = strings.TrimSpace(repository)
	if strings.Contains(repository, "://") || strings.HasPrefix(repository, "git@") {
		return repository, nil
	}
	if !safeRelativePath(repository) {
		return "", errors.New("local repository must be relative to CXFORGE_SOURCE_ROOT")
	}
	source := filepath.Join(sourceRoot, filepath.Clean(repository))
	if !within(sourceRoot, source) {
		return "", errors.New("local repository escapes CXFORGE_SOURCE_ROOT")
	}
	info, err := os.Stat(source)
	if err != nil || !info.IsDir() {
		return "", fmt.Errorf("local repository %q is unavailable", repository)
	}
	return source, nil
}

func runProcess(ctx context.Context, directory, name string, args ...string) (string, error) {
	process := exec.CommandContext(ctx, name, args...)
	process.Dir = directory
	output, err := process.CombinedOutput()
	text := strings.TrimSpace(string(output))
	if err != nil {
		return text, fmt.Errorf("%s: %w", text, err)
	}
	return text, nil
}

func (app *App) runTask(ctx context.Context, task Task, repository string) ([]string, string, modelOutput, error) {
	if app.config.ExecutionMode != "demo" {
		output, err := app.runConfiguredModel(ctx, task, repository)
		if err != nil {
			return nil, "", modelOutput{}, err
		}
		if len(output.Files) == 0 {
			return nil, "", output, errors.New("model returned no file changes")
		}
		changed, err := applyFiles(repository, task.OwnedPaths, output.Files)
		summary := strings.TrimSpace(output.Summary)
		if summary == "" {
			summary = "Model changes applied."
		}
		return changed, summary, output, err
	}

	target := filepath.Join(repository, filepath.Clean(task.OwnedPaths[0]))
	if !within(repository, target) {
		return nil, "", modelOutput{}, errors.New("owned path escapes repository")
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return nil, "", modelOutput{}, fmt.Errorf("demo edit failed: %w", err)
	}
	if err := os.WriteFile(target, []byte("CXForge demo edit\n"), 0o644); err != nil {
		return nil, "", modelOutput{}, fmt.Errorf("demo edit failed: %w", err)
	}
	return []string{task.OwnedPaths[0]}, "Demo edit completed.", modelOutput{}, nil
}

func (app *App) runConfiguredModel(ctx context.Context, task Task, repository string) (modelOutput, error) {
	input := modelInput{Prompt: task.Prompt, Repository: repository, OwnedPaths: task.OwnedPaths}
	if strings.TrimSpace(app.config.ModelCommand) != "" {
		return runModel(ctx, app.config.ModelCommand, input)
	}
	snapshot, err := repositorySnapshot(repository)
	if err != nil {
		return modelOutput{}, err
	}
	return runOpenAIModel(ctx, app.config, input, snapshot)
}

func (app *App) modelProvider() string {
	if app.config.ExecutionMode == "demo" {
		return "demo"
	}
	if strings.TrimSpace(app.config.ModelCommand) != "" {
		return "command"
	}
	if strings.TrimSpace(app.config.OpenAIAPIKey) != "" {
		return "openai"
	}
	return "unconfigured"
}

func (app *App) clearCancellation(taskID string, cancel context.CancelFunc) {
	cancel()
	app.store.Lock()
	delete(app.store.cancels, taskID)
	app.store.Unlock()
}

func runModel(ctx context.Context, command string, input modelInput) (modelOutput, error) {
	if strings.TrimSpace(command) == "" {
		return modelOutput{}, errors.New("no model executor is configured")
	}
	payload, _ := json.Marshal(input)
	process := exec.CommandContext(ctx, "sh", "-lc", command)
	process.Stdin = strings.NewReader(string(payload))
	var standardError bytes.Buffer
	process.Stderr = &standardError
	output, err := process.Output()
	if err != nil {
		return modelOutput{}, fmt.Errorf("model command failed: %w: %s", err, strings.TrimSpace(standardError.String()))
	}
	var result modelOutput
	if err := json.Unmarshal(output, &result); err != nil {
		return modelOutput{}, fmt.Errorf("model output must be JSON: %w", err)
	}
	return result, nil
}

func applyFiles(repository string, owned []string, files []modelFile) ([]string, error) {
	changed := make([]string, 0, len(files))
	for _, file := range files {
		path := filepath.Clean(file.Path)
		if !ownedPath(path, owned) {
			return nil, fmt.Errorf("model attempted to edit unowned path %q", file.Path)
		}
		target := filepath.Join(repository, path)
		if !within(repository, target) {
			return nil, fmt.Errorf("model path escapes repository: %q", file.Path)
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return nil, err
		}
		if err := os.WriteFile(target, []byte(file.Content), 0o644); err != nil {
			return nil, err
		}
		changed = append(changed, path)
	}
	return changed, nil
}

func ownedPath(path string, owned []string) bool {
	for _, prefix := range owned {
		clean := filepath.Clean(prefix)
		if path == clean || strings.HasPrefix(path, clean+string(filepath.Separator)) {
			return true
		}
	}
	return false
}

func runCommand(ctx context.Context, command, directory string) (string, error) {
	if strings.TrimSpace(command) == "" {
		return "skipped: no verification command configured", nil
	}
	process := exec.CommandContext(ctx, "sh", "-lc", command)
	process.Dir = directory
	output, err := process.CombinedOutput()
	text := strings.TrimSpace(string(output))
	if err != nil {
		return text, fmt.Errorf("verification failed: %w", err)
	}
	return text, nil
}

func gitDiff(ctx context.Context, directory string, changed []string) string {
	process := exec.CommandContext(ctx, "git", "diff", "--no-ext-diff", "--no-color")
	process.Dir = directory
	output, _ := process.Output()
	if text := strings.TrimSpace(string(output)); text != "" {
		return text
	}

	var diffs []string
	for _, path := range changed {
		process = exec.CommandContext(ctx, "git", "diff", "--no-index", "--no-color", "--", os.DevNull, filepath.Clean(path))
		process.Dir = directory
		output, _ = process.Output()
		if text := strings.TrimSpace(string(output)); text != "" {
			diffs = append(diffs, text)
		}
	}
	return strings.Join(diffs, "\n")
}

func contextWithTimeout(seconds int) (context.Context, context.CancelFunc) {
	if seconds < 1 {
		seconds = 300
	}
	return context.WithTimeout(context.Background(), time.Duration(seconds)*time.Second)
}

func taskRepository(config Config, taskID string) string {
	return filepath.Join(config.WorkspaceRoot, taskID, "repo")
}
