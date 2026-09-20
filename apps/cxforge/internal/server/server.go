package server

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const maxRequestBytes = 1 << 20

type Config struct {
	Address, ClientKey, ServerID, ContainerName, ContainerID            string
	Version                                                             string
	PreviewOrigin, WorkspaceRoot, SourceRoot                            string
	ExecutionMode, ModelCommand, TestCommand, PreviewCommand, StatePath string
	GitToken, GitHubAPIURL                                              string
	CredentialEncryptionKey                                             string
	AlertWebhookURL                                                     string
	OpenAIBaseURL, OpenAIAPIKey, OpenAIModel                            string
	ReasoningEffort                                                     string
	PreviewPorts                                                        []int
	CommandTimeout, MaxWorkers, MaxAgentTurns                           int
	InputPricePerMillion, OutputPricePerMillion                         float64
	CostAlertThresholdUSD                                               float64
	AllowRepoCommands                                                   bool
}

type MergeRequestDraft struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	BaseBranch      string `json:"baseBranch"`
	SourceBranch    string `json:"sourceBranch"`
	BranchPublished bool   `json:"branchPublished"`
	Provider        string `json:"provider,omitempty"`
	ExternalID      string `json:"externalId,omitempty"`
	URL             string `json:"url,omitempty"`
	Status          string `json:"status"`
}

type Task struct {
	Revision            int                `json:"revision"`
	ID                  string             `json:"id"`
	Title               string             `json:"title"`
	AppName             string             `json:"appName"`
	Prompt              string             `json:"prompt"`
	Repository          string             `json:"repository"`
	RepositoryProfileID string             `json:"repositoryProfileId,omitempty"`
	BaseBranch          string             `json:"baseBranch,omitempty"`
	BaseCommitSHA       string             `json:"baseCommitSha,omitempty"`
	GitConnectionID     string             `json:"gitConnectionId,omitempty"`
	OwnedPaths          []string           `json:"ownedPaths"`
	Status              string             `json:"status"`
	CreatedAt           string             `json:"createdAt"`
	Report              string             `json:"report"`
	PreviewURL          string             `json:"previewUrl,omitempty"`
	PreviewStatus       string             `json:"previewStatus,omitempty"`
	PreviewInternalPort int                `json:"previewInternalPort,omitempty"`
	ChangedFiles        []string           `json:"changedFiles,omitempty"`
	TestOutput          string             `json:"testOutput,omitempty"`
	Diff                string             `json:"diff,omitempty"`
	AgentTurns          int                `json:"agentTurns,omitempty"`
	InputTokens         int                `json:"inputTokens,omitempty"`
	OutputTokens        int                `json:"outputTokens,omitempty"`
	EstimatedCostUSD    float64            `json:"estimatedCostUsd,omitempty"`
	MergeRequest        *MergeRequestDraft `json:"mergeRequest,omitempty"`
}

type TaskEvent struct {
	ID        string `json:"id"`
	TaskID    string `json:"taskId"`
	Type      string `json:"type"`
	Status    string `json:"status,omitempty"`
	Message   string `json:"message"`
	CreatedAt string `json:"createdAt"`
}

type RuntimeMetrics struct {
	TasksCreated   uint64 `json:"tasksCreated"`
	TasksCompleted uint64 `json:"tasksCompleted"`
	TasksBlocked   uint64 `json:"tasksBlocked"`
	ModelRequests  uint64 `json:"modelRequests"`
	InputTokens    uint64 `json:"inputTokens"`
	OutputTokens   uint64 `json:"outputTokens"`
}

type Artifact struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Kind   string `json:"kind"`
	Status string `json:"status"`
}
type Skill struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

type GitPermissions struct {
	Clone bool `json:"clone"`
	Pull  bool `json:"pull"`
	Push  bool `json:"push"`
}

type GitConnection struct {
	ID                 string         `json:"id"`
	Name               string         `json:"name"`
	Provider           string         `json:"provider"`
	Username           string         `json:"username,omitempty"`
	RepositoryPatterns []string       `json:"repositoryPatterns"`
	Permissions        GitPermissions `json:"permissions"`
	SecretConfigured   bool           `json:"secretConfigured"`
	CreatedAt          string         `json:"createdAt"`
	UpdatedAt          string         `json:"updatedAt"`
}

type RepositoryProfile struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Repository      string `json:"repository"`
	GitConnectionID string `json:"gitConnectionId"`
	DefaultBranch   string `json:"defaultBranch"`
	WorkspaceStatus string `json:"workspaceStatus"`
	CommitSHA       string `json:"commitSha,omitempty"`
	UpdatedAt       string `json:"updatedAt,omitempty"`
}

type Store struct {
	sync.RWMutex
	workspaceTaskID string
	messages        map[string][]TaskMessage
	tasks           map[string]Task
	artifacts       map[string]Artifact
	skills          map[string]Skill
	cancels         map[string]context.CancelFunc
	events          map[string][]TaskEvent
	subscribers     map[string]map[chan TaskEvent]struct{}
	previews        map[string]context.CancelFunc
	nextPreview     int
	metrics         RuntimeMetrics
	gitConnections  map[string]GitConnection
	gitSecrets      map[string]string
	repositories    map[string]RepositoryProfile
	config          Config
}
type App struct {
	workspace sync.Mutex
	control   sync.Mutex
	store     *Store
	config    Config
	queue     chan Task
	persist   sync.Mutex
}

func ConfigFromEnvironment() Config {
	timeout, _ := strconv.Atoi(env("CXFORGE_COMMAND_TIMEOUT", "300"))
	if timeout < 1 {
		timeout = 300
	}
	maxWorkers := 1
	maxTurns, _ := strconv.Atoi(env("CXFORGE_MAX_AGENT_TURNS", "4"))
	if maxTurns < 1 {
		maxTurns = 1
	}
	inputPrice, _ := strconv.ParseFloat(env("CXFORGE_INPUT_PRICE_PER_MILLION", "0"), 64)
	outputPrice, _ := strconv.ParseFloat(env("CXFORGE_OUTPUT_PRICE_PER_MILLION", "0"), 64)
	costAlert, _ := strconv.ParseFloat(env("CXFORGE_COST_ALERT_THRESHOLD_USD", "0"), 64)
	allowRepoCommands, _ := strconv.ParseBool(env("CXFORGE_ALLOW_REPO_COMMANDS", "false"))
	return Config{
		Address: env("CXFORGE_ADDRESS", ":6400"), ClientKey: env("CXFORGE_ZUNO_CLIENT_KEY", "local-zuno-to-cxforge-client-key-32chars"),
		Version:  env("CXFORGE_VERSION", "dev"),
		ServerID: env("CXFORGE_SERVER_ID", "00000000-0000-4000-8000-000000000001"), ContainerName: env("CXFORGE_CONTAINER_NAME", env("HOSTNAME", "cxforge")),
		ContainerID: env("HOSTNAME", "local"), PreviewOrigin: env("CXFORGE_PREVIEW_ORIGIN", "http://127.0.0.1"),
		WorkspaceRoot: env("CXFORGE_WORKSPACE_ROOT", "/workspace"), SourceRoot: env("CXFORGE_SOURCE_ROOT", "/repositories"),
		ExecutionMode: env("CXFORGE_EXECUTION_MODE", "blocked"), ModelCommand: os.Getenv("CXFORGE_MODEL_COMMAND"), TestCommand: os.Getenv("CXFORGE_TEST_COMMAND"), PreviewCommand: os.Getenv("CXFORGE_PREVIEW_COMMAND"),
		StatePath: env("CXFORGE_STATE_PATH", "/workspace/.cxforge-state.json"), GitToken: secretEnv("CXFORGE_GIT_TOKEN", "CXFORGE_GIT_TOKEN_FILE"), GitHubAPIURL: env("CXFORGE_GITHUB_API_URL", "https://api.github.com"),
		CredentialEncryptionKey: secretEnv("CXFORGE_CREDENTIAL_ENCRYPTION_KEY", "CXFORGE_CREDENTIAL_ENCRYPTION_KEY_FILE"),
		AlertWebhookURL:         os.Getenv("CXFORGE_ALERT_WEBHOOK_URL"),
		OpenAIBaseURL:           env("OPENAI_BASE_URL", "https://api.openai.com/v1"), OpenAIAPIKey: secretEnv("OPENAI_API_KEY", "OPENAI_API_KEY_FILE"), OpenAIModel: env("CXFORGE_OPENAI_MODEL", "gpt-5.6-terra"), ReasoningEffort: env("CXFORGE_REASONING_EFFORT", "high"),
		PreviewPorts: []int{7300, 7301, 7302, 7303}, CommandTimeout: timeout, MaxWorkers: maxWorkers, MaxAgentTurns: maxTurns,
		InputPricePerMillion: inputPrice, OutputPricePerMillion: outputPrice,
		CostAlertThresholdUSD: costAlert,
		AllowRepoCommands:     allowRepoCommands,
	}
}

func New(config Config) *App {
	config.MaxWorkers = 1
	if config.MaxAgentTurns < 1 {
		config.MaxAgentTurns = 1
	}
	store := &Store{tasks: map[string]Task{}, artifacts: map[string]Artifact{}, skills: map[string]Skill{}, cancels: map[string]context.CancelFunc{}, events: map[string][]TaskEvent{}, subscribers: map[string]map[chan TaskEvent]struct{}{}, previews: map[string]context.CancelFunc{}, gitConnections: map[string]GitConnection{}, gitSecrets: map[string]string{}, repositories: map[string]RepositoryProfile{}, config: config}
	for _, skill := range []Skill{{"repo.read", "Read repository", true}, {"code.edit", "Edit owned files", true}, {"code.test", "Run tests", true}, {"preview.web", "Start preview", true}} {
		store.skills[skill.ID] = skill
	}
	app := &App{store: store, config: config, queue: make(chan Task, 256)}
	app.loadState()
	app.initializeSingleWorkspace()
	app.startWorkers()
	app.recoverQueue()
	app.recoverPreviews()
	return app
}

func (app *App) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", app.welcome)
	mux.HandleFunc("GET /api/v1/cxforge/health", app.health)
	mux.HandleFunc("GET /api/v1/cxforge/runner/health", app.runnerHealth)
	mux.HandleFunc("GET /api/v1/cxforge/control/overview", app.auth(app.overview))
	mux.HandleFunc("GET /api/v1/cxforge/control/metrics", app.auth(app.metricsHandler))
	mux.HandleFunc("GET /api/v1/cxforge/control/tasks/", app.auth(app.taskEvents))
	mux.HandleFunc("GET /api/v1/cxforge/control/skills", app.auth(app.skills))
	mux.HandleFunc("PUT /api/v1/cxforge/control/skills", app.auth(app.updateSkills))
	mux.HandleFunc("GET /api/v1/cxforge/control/git-connections", app.auth(app.listGitConnections))
	mux.HandleFunc("POST /api/v1/cxforge/control/git-connections", app.auth(app.createGitConnection))
	mux.HandleFunc("PUT /api/v1/cxforge/control/git-connections/", app.auth(app.updateGitConnection))
	mux.HandleFunc("DELETE /api/v1/cxforge/control/git-connections/", app.auth(app.deleteGitConnection))
	mux.HandleFunc("POST /api/v1/cxforge/control/git-connections/", app.auth(app.gitConnectionAction))
	mux.HandleFunc("GET /api/v1/cxforge/control/repositories", app.auth(app.listRepositories))
	mux.HandleFunc("POST /api/v1/cxforge/control/repositories", app.auth(app.createRepository))
	mux.HandleFunc("POST /api/v1/cxforge/control/repositories/", app.auth(app.repositoryAction))
	mux.HandleFunc("POST /api/v1/cxforge/control/tasks", app.auth(app.createTask))
	mux.HandleFunc("POST /api/v1/cxforge/control/tasks/", app.auth(app.taskAction))
	return logging(mux)
}

func (app *App) welcome(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte("<!doctype html><meta name=viewport content='width=device-width'><title>CXForge</title><style>body{font:16px system-ui;background:#101412;color:#edf5ef;display:grid;place-items:center;height:100vh;margin:0}main{max-width:520px;padding:42px;border:1px solid #334439;border-radius:18px}strong{color:#70d493}</style><main><h1>CXForge</h1><p><strong>Worker server ready.</strong></p><p>Connect Zuno to submit isolated coding tasks.</p></main>"))
}
func (app *App) health(w http.ResponseWriter, _ *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]any{"status": "ok", "version": app.config.Version, "providers": []string{"cxforge.worker"}, "modelProvider": app.modelProvider()})
}
func (app *App) runnerHealth(w http.ResponseWriter, _ *http.Request) {
	issues := app.readinessIssues()
	status := "ready"
	if len(issues) > 0 {
		status = "blocked"
	}
	jsonResponse(w, http.StatusOK, map[string]any{"status": status, "modelProvider": app.modelProvider(), "issues": issues})
}

func (app *App) readinessIssues() []string {
	var issues []string
	if app.config.ExecutionMode == "model" && app.modelProvider() == "unconfigured" {
		issues = append(issues, "model provider is not configured")
	}
	if app.config.ExecutionMode == "model" && app.config.ClientKey == "local-zuno-to-cxforge-client-key-32chars" {
		issues = append(issues, "default client key is not allowed in model mode")
	}
	app.store.RLock()
	hasGitConnections := len(app.store.gitConnections) > 0
	app.store.RUnlock()
	if hasGitConnections && len(app.config.CredentialEncryptionKey) < 32 {
		issues = append(issues, "git credential encryption key is unavailable")
	}
	return issues
}

func (app *App) overview(w http.ResponseWriter, _ *http.Request) {
	app.store.RLock()
	defer app.store.RUnlock()
	jsonResponse(w, http.StatusOK, map[string]any{
		"executionTopology": "single-workspace", "maxWorkers": 1, "workspaceTaskId": app.store.workspaceTaskID, "taskMessages": app.store.messages,
		"agents":    []map[string]any{{"id": "agent-" + shortID(app.config.ServerID), "name": "CXForge worker", "status": "ready", "capabilities": []string{"workspace", "runner", "preview"}}},
		"artifacts": sortedArtifacts(app.store.artifacts), "components": []string{"api", "runner", "workspace", "model", "tests", "preview", "git"},
		"containerId": app.config.ContainerID, "containerName": app.config.ContainerName, "version": app.config.Version, "mode": "local-edge", "previewPorts": app.config.PreviewPorts,
		"runnerUrl": "http://127.0.0.1:6402", "serverId": app.config.ServerID, "skills": sortedSkills(app.store.skills), "tasks": sortedTasks(app.store.tasks),
		"gitConnections": sortedGitConnections(app.store.gitConnections), "repositories": sortedRepositories(app.store.repositories), "credentialEncryptionConfigured": len(app.config.CredentialEncryptionKey) >= 32,
	})
}
func (app *App) skills(w http.ResponseWriter, _ *http.Request) {
	app.store.RLock()
	defer app.store.RUnlock()
	jsonResponse(w, http.StatusOK, sortedSkills(app.store.skills))
}

func (app *App) updateSkills(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Skills []struct {
			ID      string `json:"id"`
			Enabled bool   `json:"enabled"`
		} `json:"skills"`
	}
	if err := decode(w, r, &input); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	app.store.Lock()
	for _, update := range input.Skills {
		if item, ok := app.store.skills[update.ID]; ok {
			item.Enabled = update.Enabled
			app.store.skills[update.ID] = item
		}
	}
	items := sortedSkills(app.store.skills)
	app.store.Unlock()
	jsonResponse(w, http.StatusOK, items)
}

func (app *App) createTask(w http.ResponseWriter, r *http.Request) {
	var task Task
	if err := decode(w, r, &task); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if err := app.hydrateTaskRepository(&task); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateTask(task); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if err := app.validateTaskGitConnection(task); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	task.ID = newID()
	task.Status = "draft"
	task.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	task.Report = "Task contract created and waiting for worker execution."
	app.store.Lock()
	for _, existing := range app.store.tasks {
		if existing.Repository != task.Repository {
			app.store.Unlock()
			jsonError(w, http.StatusConflict, errors.New("all tasks in this container must use the same repository"))
			return
		}
	}
	task.Revision = 1
	app.store.tasks[task.ID] = task
	app.store.metrics.TasksCreated++
	app.store.Unlock()
	app.saveState()
	app.emitEvent(task.ID, "task.created", "draft", "Task contract created.")
	jsonResponse(w, http.StatusCreated, task)
}

func (app *App) taskAction(w http.ResponseWriter, r *http.Request) {
	app.control.Lock()
	defer app.control.Unlock()
	id, action, ok := parseTaskAction(r.URL.Path)
	if !ok {
		jsonError(w, http.StatusNotFound, errors.New("unknown task action"))
		return
	}
	app.store.RLock()
	owner := app.store.workspaceTaskID
	app.store.RUnlock()
	if owner != "" && owner != id && (action == "approve" || action == "prepare-merge" || action == "create-pull-request" || action == "complete" || action == "record-merged") {
		jsonError(w, http.StatusConflict, errors.New("task is historical; another task owns this container"))
		return
	}
	switch action {
	case "complete":
		app.completeTask(w, id)
	case "messages":
		app.continueTask(w, r, id)
	case "queue":
		app.queueTask(w, id)
	case "approve":
		app.reviewTask(w, id, "approved", "Review approved. Ready for the next governed merge step.")
	case "reject":
		app.reviewTask(w, id, "blocked", "Review rejected. Worker output needs revision before merge.")
	case "prepare-merge":
		app.prepareMergeRequest(w, id)
	case "record-merge-request":
		app.recordMergeRequest(w, r, id)
	case "create-pull-request":
		app.createGitHubPullRequest(w, id)
	case "record-merged":
		app.recordMerged(w, id)
	case "cancel":
		app.cancelTask(w, id)
	case "pull":
		app.pullTask(w, id)
	case "retry":
		app.retryTask(w, id)
	default:
		jsonError(w, http.StatusNotFound, errors.New("unknown task action"))
	}
}

func (app *App) queueTask(w http.ResponseWriter, id string) {
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok || task.Status != "draft" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only a draft task can enter the worker queue"))
		return
	}
	if len(app.config.PreviewPorts) == 0 {
		app.store.Unlock()
		jsonError(w, http.StatusServiceUnavailable, errors.New("no preview ports are configured"))
		return
	}
	port := app.config.PreviewPorts[0]
	if configured, err := strconv.Atoi(os.Getenv("CXFORGE_PREVIEW_PUBLIC_PORT")); err == nil && configured > 0 {
		port = configured
	}
	app.store.nextPreview++
	task.Status = "queued"
	if task.PreviewURL == "" {
		task.PreviewURL = fmt.Sprintf("%s:%d/preview/%s/", app.config.PreviewOrigin, port, id)
	}
	task.Report = "Accepted by CXForge. Workspace preparation is queued."
	app.store.tasks[id] = task
	app.store.artifacts[id+":workspace"] = Artifact{id + ":workspace", "Workspace " + shortID(id), "workspace", "pending"}
	app.store.Unlock()
	app.saveState()
	if !app.enqueue(task) {
		app.finish(task, "blocked", "Worker queue is full.")
		jsonError(w, http.StatusServiceUnavailable, errors.New("worker queue is full"))
		return
	}
	app.emitEvent(task.ID, "task.queued", "queued", "Task accepted by the worker queue.")
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) reviewTask(w http.ResponseWriter, id, status, report string) {
	if !app.workspace.TryLock() {
		jsonError(w, http.StatusConflict, errors.New("workspace is executing a command"))
		return
	}
	defer app.workspace.Unlock()
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	if task.Status != "review" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only a task in review can be approved or rejected"))
		return
	}
	task.Status = status
	task.Report = report
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "task."+status, status, report)
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) prepareMergeRequest(w http.ResponseWriter, id string) {
	if !app.workspace.TryLock() {
		jsonError(w, http.StatusConflict, errors.New("workspace is executing a command"))
		return
	}
	defer app.workspace.Unlock()
	app.store.RLock()
	task, ok := app.store.tasks[id]
	if !ok {
		app.store.RUnlock()
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	if task.Status != "approved" {
		app.store.RUnlock()
		jsonError(w, http.StatusConflict, errors.New("only an approved task can prepare a merge request"))
		return
	}
	app.store.RUnlock()

	sourceBranch, published, err := app.prepareMergeBranch(task)
	if err != nil {
		jsonError(w, http.StatusConflict, err)
		return
	}
	baseBranch := task.BaseBranch
	if baseBranch == "" {
		baseBranch = "main"
	}
	previous := task.MergeRequest
	task.MergeRequest = &MergeRequestDraft{
		Title: task.Title, Description: mergeRequestDescription(task), BaseBranch: baseBranch,
		SourceBranch: sourceBranch, BranchPublished: published, Status: "draft",
	}
	if previous != nil && previous.Status == "open" {
		task.MergeRequest.Provider, task.MergeRequest.ExternalID, task.MergeRequest.URL, task.MergeRequest.Status = previous.Provider, previous.ExternalID, previous.URL, previous.Status
	}
	task.Report = "Merge request draft prepared. Choose a Git provider to create it."
	app.store.Lock()
	app.store.tasks[id] = task
	app.store.artifacts[id+":patch"] = Artifact{id + ":patch", "Merge request draft " + shortID(id), "patch", "ready"}
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "merge.draft", "approved", "Merge request draft prepared.")
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) recordMergeRequest(w http.ResponseWriter, r *http.Request, id string) {
	var input struct {
		Provider   string `json:"provider"`
		ExternalID string `json:"externalId"`
		URL        string `json:"url"`
	}
	if err := decode(w, r, &input); err != nil || input.Provider == "" || input.ExternalID == "" || input.URL == "" {
		jsonError(w, http.StatusBadRequest, errors.New("provider, externalId, and url are required"))
		return
	}
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok || task.Status != "approved" || task.MergeRequest == nil || task.MergeRequest.Status != "draft" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only a prepared approved task can record a merge request"))
		return
	}
	task.MergeRequest.Provider = input.Provider
	task.MergeRequest.ExternalID = input.ExternalID
	task.MergeRequest.URL = input.URL
	task.MergeRequest.Status = "open"
	task.Report = "Pull request created. Waiting for explicit merge confirmation."
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "pull_request.recorded", "approved", task.MergeRequest.URL)
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) recordMerged(w http.ResponseWriter, id string) {
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok || task.MergeRequest == nil || task.MergeRequest.Status != "open" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only an open pull request can be recorded as merged"))
		return
	}
	task.Status = "merged"
	task.MergeRequest.Status = "merged"
	task.Report = "Pull request merged after user confirmation."
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "task.merged", "merged", task.Report)
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) retryTask(w http.ResponseWriter, id string) {
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	if task.Status != "blocked" || app.store.cancels[id] != nil {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only a blocked task can be retried"))
		return
	}
	task.Status = "draft"
	task.Report = "Retry requested."
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.queueTask(w, id)
}

func (app *App) cancelTask(w http.ResponseWriter, id string) {
	app.store.Lock()
	task, ok := app.store.tasks[id]
	if !ok {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	if task.Status != "queued" && task.Status != "running" {
		app.store.Unlock()
		jsonError(w, http.StatusConflict, errors.New("only queued or running tasks can be cancelled"))
		return
	}
	if cancel := app.store.cancels[id]; cancel != nil {
		cancel()
	}
	task.Status = "blocked"
	task.Report = "Execution cancelled by operator."
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "task.cancelled", "blocked", task.Report)
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) finish(task Task, status, report string) {
	app.store.Lock()
	current, ok := app.store.tasks[task.ID]
	if ok && current.Status == "blocked" && strings.Contains(current.Report, "cancelled") {
		app.store.Unlock()
		return
	}
	task.Status = status
	task.Report = report
	app.store.tasks[task.ID] = task
	if status == "review" {
		app.store.metrics.TasksCompleted++
	}
	if status == "blocked" {
		app.store.metrics.TasksBlocked++
	}
	artifact := app.store.artifacts[task.ID+":workspace"]
	artifact.Status = "ready"
	app.store.artifacts[task.ID+":workspace"] = artifact
	app.store.Unlock()
	app.saveState()
	app.emitEvent(task.ID, "task."+status, status, report)
	app.notifyTaskOutcome(task)
}

type persistedState struct {
	WorkspaceTaskID string                       `json:"workspaceTaskId,omitempty"`
	Messages        map[string][]TaskMessage     `json:"messages,omitempty"`
	Tasks           map[string]Task              `json:"tasks"`
	Artifacts       map[string]Artifact          `json:"artifacts"`
	Events          map[string][]TaskEvent       `json:"events,omitempty"`
	Metrics         RuntimeMetrics               `json:"metrics,omitempty"`
	GitConnections  map[string]GitConnection     `json:"gitConnections,omitempty"`
	GitSecrets      map[string]string            `json:"gitSecrets,omitempty"`
	Repositories    map[string]RepositoryProfile `json:"repositories,omitempty"`
}

func (app *App) loadState() {
	data, err := os.ReadFile(app.config.StatePath)
	if err != nil {
		return
	}
	var state persistedState
	if json.Unmarshal(data, &state) != nil {
		return
	}
	if state.Tasks != nil {
		app.store.tasks = normalizePersistedTasks(state.Tasks)
	}
	if state.Artifacts != nil {
		app.store.artifacts = state.Artifacts
	}
	if state.Events != nil {
		app.store.events = state.Events
	}
	if state.GitConnections != nil {
		app.store.gitConnections = state.GitConnections
	}
	if state.GitSecrets != nil {
		app.store.gitSecrets = state.GitSecrets
	}
	if state.Repositories != nil {
		app.store.repositories = state.Repositories
	}
	app.store.workspaceTaskID = state.WorkspaceTaskID
	app.store.messages = state.Messages
	app.store.metrics = state.Metrics
}

func normalizePersistedTasks(tasks map[string]Task) map[string]Task {
	for id, task := range tasks {
		if task.MergeRequest == nil || task.MergeRequest.Status != "" {
			continue
		}
		task.MergeRequest.Status = "draft"
		if task.MergeRequest.SourceBranch == "" {
			task.MergeRequest.SourceBranch = "cxforge/" + id
		}
		tasks[id] = task
	}
	return tasks
}

func (app *App) saveState() {
	app.persist.Lock()
	defer app.persist.Unlock()
	app.store.RLock()
	data, err := json.MarshalIndent(persistedState{WorkspaceTaskID: app.store.workspaceTaskID, Messages: app.store.messages, Tasks: app.store.tasks, Artifacts: app.store.artifacts, Events: app.store.events, Metrics: app.store.metrics, GitConnections: app.store.gitConnections, GitSecrets: app.store.gitSecrets, Repositories: app.store.repositories}, "", "  ")
	app.store.RUnlock()
	if err != nil {
		return
	}
	_ = writeStateAtomic(app.config.StatePath, data)
}
func (app *App) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		provided := []byte(r.Header.Get("X-CXForge-Client-Key"))
		expected := []byte(app.config.ClientKey)
		if len(provided) != len(expected) || subtle.ConstantTimeCompare(provided, expected) != 1 {
			jsonError(w, http.StatusUnauthorized, errors.New("authentication required"))
			return
		}
		next(w, r)
	}
}

func validateTask(task Task) error {
	if strings.TrimSpace(task.Title) == "" || strings.TrimSpace(task.Prompt) == "" || strings.TrimSpace(task.Repository) == "" || len(task.OwnedPaths) == 0 {
		return errors.New("title, prompt, repository, and ownedPaths are required")
	}
	for _, path := range task.OwnedPaths {
		if !safeRelativePath(path) {
			return fmt.Errorf("owned path %q must be relative and remain inside the repository", path)
		}
	}
	return nil
}
func decode(w http.ResponseWriter, r *http.Request, target any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
func jsonResponse(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func jsonError(w http.ResponseWriter, status int, err error) {
	jsonResponse(w, status, map[string]string{"error": err.Error()})
}
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		fmt.Printf("%s %s %s\n", r.Method, r.URL.Path, time.Since(start))
	})
}
func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func secretEnv(key, fileKey string) string {
	if path := strings.TrimSpace(os.Getenv(fileKey)); path != "" {
		if content, err := os.ReadFile(path); err == nil {
			return strings.TrimSpace(string(content))
		}
	}
	return strings.TrimSpace(os.Getenv(key))
}
func newID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("00000000-0000-4000-8000-%012d", time.Now().UnixNano()%1_000_000_000_000)
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16])
}
func within(root, candidate string) bool {
	relative, err := filepath.Rel(filepath.Clean(root), filepath.Clean(candidate))
	return err == nil && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator))
}
func safeRelativePath(path string) bool {
	clean := filepath.Clean(strings.TrimSpace(path))
	return clean != "." && clean != ".." && !filepath.IsAbs(clean) && !strings.HasPrefix(clean, ".."+string(filepath.Separator))
}
func parseTaskAction(path string) (string, string, bool) {
	parts := strings.Split(strings.TrimPrefix(path, "/api/v1/cxforge/control/tasks/"), "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", false
	}
	return parts[0], parts[1], true
}
func mergeRequestDescription(task Task) string {
	changed := "No changed files were reported."
	if len(task.ChangedFiles) > 0 {
		changed = "Changed files:\n- " + strings.Join(task.ChangedFiles, "\n- ")
	}
	return fmt.Sprintf("CXForge task %s\n\n%s\n\n%s", task.ID, task.Report, changed)
}
func shortID(value string) string {
	if len(value) <= 8 {
		return value
	}
	return value[:8]
}
func sortedTasks(source map[string]Task) []Task {
	items := make([]Task, 0, len(source))
	for _, item := range source {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	return items
}
func sortedArtifacts(source map[string]Artifact) []Artifact {
	items := make([]Artifact, 0, len(source))
	for _, item := range source {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items
}
func sortedSkills(source map[string]Skill) []Skill {
	items := make([]Skill, 0, len(source))
	for _, item := range source {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items
}
