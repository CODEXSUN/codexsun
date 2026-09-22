package server

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func (app *App) startPreview(waitContext context.Context, task Task, repository, previewCommand string) (Task, error) {
	if strings.TrimSpace(previewCommand) == "" {
		return task, nil
	}
	app.store.RLock()
	for id := range app.store.previews {
		previous := app.store.tasks[id]
		if previous.PreviewStatus == "ready" {
			task.PreviewStatus, task.PreviewInternalPort = previous.PreviewStatus, previous.PreviewInternalPort
			app.store.RUnlock()
			return task, nil
		}
	}
	app.store.RUnlock()
	port, err := freeTCPPort()
	if err != nil {
		return task, err
	}
	previewContext, cancel := context.WithCancel(context.Background())
	command := strings.ReplaceAll(previewCommand, "{port}", strconv.Itoa(port))
	process := exec.CommandContext(previewContext, "sh", "-lc", command)
	configureToolProcess(process)
	process.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=/tmp", "PORT=" + strconv.Itoa(port), "HOST=0.0.0.0"}
	directory := repository
	if task.Tools != nil && task.Tools.Setup != nil {
		directory, err = resolveSetupDirectory(repository, task.Tools.Setup.Directory)
		if err != nil {
			cancel()
			return task, err
		}
	}
	environment, err := commandEnvironment(repository, directory)
	if err != nil {
		cancel()
		return task, err
	}
	process.Dir = directory
	process.Env = append(process.Env, environment...)
	process.Env = append(process.Env, "PORT="+strconv.Itoa(port))
	logPath := filepath.Join(filepath.Dir(app.config.StatePath), "preview.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		cancel()
		return task, err
	}
	process.Stdout = logFile
	process.Stderr = logFile
	if err := process.Start(); err != nil {
		_ = logFile.Close()
		cancel()
		return task, fmt.Errorf("could not start preview: %w", err)
	}

	app.store.Lock()
	if existing := app.store.previews[task.ID]; existing != nil {
		existing()
	}
	app.store.previews[task.ID] = cancel
	app.store.Unlock()
	go app.waitForPreviewProcess(task.ID, port, process, logFile)

	if err := waitForHTTP(waitContext, port); err != nil {
		cancel()
		return task, err
	}
	task.PreviewInternalPort = port
	task.PreviewStatus = "ready"
	app.emitEvent(task.ID, "preview.ready", "running", "Application preview is ready.")
	return task, nil
}

func (app *App) waitForPreviewProcess(taskID string, port int, process *exec.Cmd, logFile *os.File) {
	err := process.Wait()
	_ = logFile.Close()
	app.store.Lock()
	delete(app.store.previews, taskID)
	task := app.store.tasks[taskID]
	for id, current := range app.store.tasks {
		if current.PreviewInternalPort == port {
			current.PreviewStatus = "stopped"
			app.store.tasks[id] = current
		}
	}
	app.store.Unlock()
	app.saveState()
	if err != nil {
		app.emitEvent(taskID, "preview.stopped", task.Status, "Application preview stopped: "+err.Error())
	}
}

func (app *App) recoverPreviews() {
	if strings.TrimSpace(app.config.PreviewCommand) == "" && !app.config.AllowRepoCommands && app.config.ExecutionMode != "tools" {
		return
	}
	app.store.RLock()
	var tasks []Task
	for _, task := range app.store.tasks {
		if task.PreviewStatus == "ready" && (task.Status == "review" || task.Status == "approved") {
			if task.Tools != nil && task.Tools.PreviewCommand == "" {
				continue
			}
			if len(tasks) == 0 || task.CreatedAt > tasks[0].CreatedAt {
				tasks = []Task{task}
			}
		}
	}
	app.store.RUnlock()
	for _, task := range tasks {
		go func(task Task) {
			app.workspace.Lock()
			defer app.workspace.Unlock()
			ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
			defer cancel()
			repository := taskRepository(app.config, task.ID)
			policy, policyErr := loadRepositoryPolicy(repository, app.config)
			if task.Tools != nil {
				policy.PreviewCommand = task.Tools.PreviewCommand
			}
			if policyErr != nil {
				return
			}
			updated, err := app.startPreview(ctx, task, repository, policy.PreviewCommand)
			if err == nil {
				app.updateTaskPreview(updated)
			}
		}(task)
	}
}

func (app *App) updateTaskPreview(task Task) {
	app.store.Lock()
	current := app.store.tasks[task.ID]
	current.PreviewInternalPort = task.PreviewInternalPort
	current.PreviewStatus = task.PreviewStatus
	app.store.tasks[task.ID] = current
	app.store.Unlock()
	app.saveState()
}

func freeTCPPort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()
	return listener.Addr().(*net.TCPAddr).Port, nil
}

func waitForHTTP(ctx context.Context, port int) error {
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	for {
		request, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		response, err := http.DefaultClient.Do(request)
		if err == nil {
			_ = response.Body.Close()
			return nil
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("preview did not become ready: %w", ctx.Err())
		case <-ticker.C:
		}
	}
}
