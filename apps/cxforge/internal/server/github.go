package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type githubPullRequest struct {
	Number  int    `json:"number"`
	HTMLURL string `json:"html_url"`
}

func (app *App) createGitHubPullRequest(w http.ResponseWriter, id string) {
	app.store.RLock()
	task, ok := app.store.tasks[id]
	app.store.RUnlock()
	if !ok || task.Status != "approved" || task.MergeRequest == nil || !task.MergeRequest.BranchPublished {
		jsonError(w, http.StatusConflict, errors.New("an approved task with a published branch is required"))
		return
	}
	access, err := app.taskGitAccess(task, "push")
	if err != nil {
		jsonError(w, http.StatusForbidden, err)
		return
	}
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	defer cancel()
	remote, err := runProcess(ctx, taskRepository(app.config, id), "git", "remote", "get-url", "origin")
	if err != nil {
		jsonError(w, http.StatusConflict, err)
		return
	}
	owner, repository, ok := githubRepository(remote)
	if !ok {
		jsonError(w, http.StatusConflict, errors.New("origin is not a GitHub repository"))
		return
	}
	pullRequest, err := app.sendGitHubPullRequest(ctx, owner, repository, task, access.Token)
	if err != nil {
		jsonError(w, http.StatusBadGateway, err)
		return
	}

	app.store.Lock()
	task = app.store.tasks[id]
	task.MergeRequest.Provider = "github"
	task.MergeRequest.ExternalID = strconv.Itoa(pullRequest.Number)
	task.MergeRequest.URL = pullRequest.HTMLURL
	task.MergeRequest.Status = "open"
	task.Report = "GitHub pull request created. Waiting for explicit merge confirmation."
	app.store.tasks[id] = task
	app.store.Unlock()
	app.saveState()
	app.emitEvent(id, "pull_request.created", "approved", task.MergeRequest.URL)
	jsonResponse(w, http.StatusOK, task)
}

func (app *App) sendGitHubPullRequest(ctx context.Context, owner, repository string, task Task, token string) (githubPullRequest, error) {
	payload, _ := json.Marshal(map[string]string{
		"title": task.MergeRequest.Title, "body": task.MergeRequest.Description,
		"head": task.MergeRequest.SourceBranch, "base": task.MergeRequest.BaseBranch,
	})
	endpoint := fmt.Sprintf("%s/repos/%s/%s/pulls", strings.TrimRight(app.config.GitHubAPIURL, "/"), owner, repository)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return githubPullRequest{}, err
	}
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return githubPullRequest{}, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return githubPullRequest{}, fmt.Errorf("GitHub returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	var pullRequest githubPullRequest
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&pullRequest); err != nil {
		return githubPullRequest{}, err
	}
	return pullRequest, nil
}

func githubRepository(remote string) (string, string, bool) {
	remote = strings.TrimSuffix(strings.TrimSpace(remote), ".git")
	var path string
	switch {
	case strings.HasPrefix(remote, "git@github.com:"):
		path = strings.TrimPrefix(remote, "git@github.com:")
	case strings.HasPrefix(remote, "https://github.com/"):
		path = strings.TrimPrefix(remote, "https://github.com/")
	case strings.HasPrefix(remote, "ssh://git@github.com/"):
		path = strings.TrimPrefix(remote, "ssh://git@github.com/")
	default:
		return "", "", false
	}
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", false
	}
	return parts[0], parts[1], true
}
