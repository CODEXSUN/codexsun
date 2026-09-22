package server

import (
	"context"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type repositoryInput struct {
	Name            string `json:"name"`
	Repository      string `json:"repository"`
	GitConnectionID string `json:"gitConnectionId"`
	DefaultBranch   string `json:"defaultBranch"`
}

func (app *App) listRepositories(w http.ResponseWriter, _ *http.Request) {
	app.store.RLock()
	profiles := sortedRepositories(app.store.repositories)
	app.store.RUnlock()
	jsonResponse(w, http.StatusOK, profiles)
}

func (app *App) createRepository(w http.ResponseWriter, r *http.Request) {
	app.control.Lock()
	defer app.control.Unlock()
	if !app.workspace.TryLock() {
		jsonError(w, http.StatusConflict, errors.New("workspace is busy"))
		return
	}
	defer app.workspace.Unlock()
	var input repositoryInput
	if err := decode(w, r, &input); err != nil {
		jsonError(w, 400, err)
		return
	}
	if input.Name == "" || !validBranch(input.DefaultBranch) {
		jsonError(w, 400, errors.New("name and valid defaultBranch required"))
		return
	}
	access, err := app.gitAccessFor(input.GitConnectionID, input.Repository, "clone")
	if err != nil {
		jsonError(w, 403, err)
		return
	}
	app.store.RLock()
	for _, profile := range app.store.repositories {
		app.store.RUnlock()
		if profile.Repository == input.Repository {
			jsonResponse(w, 200, profile)
		} else {
			jsonError(w, 409, errors.New("this container is already configured for another repository"))
		}
		return
	}
	app.store.RUnlock()
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	defer cancel()
	if err := os.MkdirAll(app.config.WorkspaceRoot, 0700); err != nil {
		jsonError(w, 500, err)
		return
	}
	destination := taskRepository(app.config, "")
	if _, err := os.Stat(filepath.Join(destination, ".git")); err == nil {
		if err := verifyWorkspaceOrigin(ctx, destination, input.Repository); err != nil {
			jsonError(w, 409, err)
			return
		}
	} else if os.IsNotExist(err) {
		if _, err := runGitProcess(ctx, app.config.WorkspaceRoot, access, "clone", "--branch", input.DefaultBranch, "--", input.Repository, destination); err != nil {
			jsonError(w, 502, err)
			return
		}
	} else {
		jsonError(w, 500, err)
		return
	}
	commit, err := runProcess(ctx, destination, "git", "rev-parse", "HEAD")
	if err != nil {
		jsonError(w, 409, err)
		return
	}
	configureGitIdentity(ctx, destination)
	profile := RepositoryProfile{ID: newID(), Name: input.Name, Repository: input.Repository, GitConnectionID: input.GitConnectionID, DefaultBranch: input.DefaultBranch, WorkspaceStatus: "ready", CommitSHA: commit}
	app.store.Lock()
	app.store.repositories[profile.ID] = profile
	app.store.Unlock()
	app.saveState()
	jsonResponse(w, 201, profile)
}

func (app *App) repositoryAction(w http.ResponseWriter, r *http.Request) {
	jsonError(w, http.StatusConflict, errors.New("use the task pull action to update the shared checkout"))
}

func verifyWorkspaceOrigin(ctx context.Context, directory, source string) error {
	origin, err := runProcess(ctx, directory, "git", "remote", "get-url", "origin")
	if err != nil || strings.TrimSuffix(origin, ".git") != strings.TrimSuffix(source, ".git") {
		return errors.New("existing checkout belongs to another repository or needs recovery; files preserved")
	}
	return nil
}

func (app *App) hydrateTaskRepository(task *Task) error {
	if task.RepositoryProfileID != "" {
		app.store.RLock()
		profile, ok := app.store.repositories[task.RepositoryProfileID]
		app.store.RUnlock()
		if !ok {
			return errors.New("repository profile not found")
		}
		task.Repository, task.GitConnectionID, task.BaseBranch = profile.Repository, profile.GitConnectionID, profile.DefaultBranch
	}
	if task.BaseBranch == "" {
		task.BaseBranch = "main"
	}
	if !validBranch(task.BaseBranch) {
		return errors.New("invalid baseBranch")
	}
	return nil
}

func validBranch(branch string) bool {
	return branch != "" && !strings.HasPrefix(branch, "-") && !strings.Contains(branch, "..") && !strings.ContainsAny(branch, " ~^:?*[\\\r\n") && !strings.HasSuffix(branch, "/") && !strings.HasSuffix(branch, ".") && filepath.Clean(branch) != "."
}

func sortedRepositories(values map[string]RepositoryProfile) []RepositoryProfile {
	result := make([]RepositoryProfile, 0, len(values))
	for _, profile := range values {
		result = append(result, profile)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}
