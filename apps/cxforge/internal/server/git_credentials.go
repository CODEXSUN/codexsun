package server

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"sort"
	"strings"
	"time"
)

type gitConnectionInput struct {
	Name               string         `json:"name"`
	Provider           string         `json:"provider"`
	Username           string         `json:"username"`
	Token              string         `json:"token"`
	RepositoryPatterns []string       `json:"repositoryPatterns"`
	Permissions        GitPermissions `json:"permissions"`
}

type gitAccess struct {
	Connection GitConnection
	Token      string
}

func (app *App) listGitConnections(w http.ResponseWriter, _ *http.Request) {
	app.store.RLock()
	connections := sortedGitConnections(app.store.gitConnections)
	app.store.RUnlock()
	jsonResponse(w, http.StatusOK, connections)
}

func (app *App) createGitConnection(w http.ResponseWriter, r *http.Request) {
	var input gitConnectionInput
	if err := decode(w, r, &input); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateGitConnectionInput(input, true); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	ciphertext, err := encryptCredential(app.config.CredentialEncryptionKey, input.Token)
	if err != nil {
		jsonError(w, http.StatusServiceUnavailable, err)
		return
	}
	now := time.Now().UTC().Format(time.RFC3339)
	connection := GitConnection{
		ID: newID(), Name: strings.TrimSpace(input.Name), Provider: normalizedProvider(input.Provider),
		Username: strings.TrimSpace(input.Username), RepositoryPatterns: normalizedPatterns(input.RepositoryPatterns),
		Permissions: input.Permissions, SecretConfigured: true, CreatedAt: now, UpdatedAt: now,
	}
	app.store.Lock()
	app.store.gitConnections[connection.ID] = connection
	app.store.gitSecrets[connection.ID] = ciphertext
	app.store.Unlock()
	app.saveState()
	jsonResponse(w, http.StatusCreated, connection)
}

func (app *App) updateGitConnection(w http.ResponseWriter, r *http.Request) {
	id, action, ok := parseGitConnectionPath(r.URL.Path)
	if !ok || action != "" {
		jsonError(w, http.StatusNotFound, errors.New("git connection not found"))
		return
	}
	var input gitConnectionInput
	if err := decode(w, r, &input); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateGitConnectionInput(input, false); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	app.store.Lock()
	connection, exists := app.store.gitConnections[id]
	app.store.Unlock()
	if !exists {
		jsonError(w, http.StatusNotFound, errors.New("git connection not found"))
		return
	}
	var ciphertext string
	if strings.TrimSpace(input.Token) != "" {
		var err error
		ciphertext, err = encryptCredential(app.config.CredentialEncryptionKey, input.Token)
		if err != nil {
			jsonError(w, http.StatusServiceUnavailable, err)
			return
		}
	}
	connection.Name = strings.TrimSpace(input.Name)
	connection.Provider = normalizedProvider(input.Provider)
	connection.Username = strings.TrimSpace(input.Username)
	connection.RepositoryPatterns = normalizedPatterns(input.RepositoryPatterns)
	connection.Permissions = input.Permissions
	connection.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	app.store.Lock()
	if ciphertext != "" {
		app.store.gitSecrets[id] = ciphertext
		connection.SecretConfigured = true
	}
	app.store.gitConnections[id] = connection
	app.store.Unlock()
	app.saveState()
	jsonResponse(w, http.StatusOK, connection)
}

func (app *App) deleteGitConnection(w http.ResponseWriter, r *http.Request) {
	id, action, ok := parseGitConnectionPath(r.URL.Path)
	if !ok || action != "" {
		jsonError(w, http.StatusNotFound, errors.New("git connection not found"))
		return
	}
	app.store.Lock()
	if _, exists := app.store.gitConnections[id]; !exists {
		app.store.Unlock()
		jsonError(w, http.StatusNotFound, errors.New("git connection not found"))
		return
	}
	for _, task := range app.store.tasks {
		if task.GitConnectionID == id && task.Status != "merged" && task.Status != "blocked" {
			app.store.Unlock()
			jsonError(w, http.StatusConflict, errors.New("git connection is used by an active task"))
			return
		}
	}
	delete(app.store.gitConnections, id)
	delete(app.store.gitSecrets, id)
	app.store.Unlock()
	app.saveState()
	w.WriteHeader(http.StatusNoContent)
}

func (app *App) gitConnectionAction(w http.ResponseWriter, r *http.Request) {
	id, action, ok := parseGitConnectionPath(r.URL.Path)
	if !ok || action != "verify" {
		jsonError(w, http.StatusNotFound, errors.New("git connection action not found"))
		return
	}
	var input struct {
		Repository string `json:"repository"`
		Operation  string `json:"operation"`
	}
	if err := decode(w, r, &input); err != nil {
		jsonError(w, http.StatusBadRequest, err)
		return
	}
	access, err := app.gitAccessFor(id, input.Repository, input.Operation)
	if err != nil {
		jsonError(w, http.StatusForbidden, err)
		return
	}
	if input.Operation == "push" {
		jsonResponse(w, http.StatusOK, map[string]any{"status": "allowed", "operation": "push", "remoteChecked": false})
		return
	}
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	defer cancel()
	if err := verifyGitRemote(ctx, input.Repository, access); err != nil {
		jsonError(w, http.StatusBadGateway, err)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]any{"status": "verified", "operation": input.Operation, "remoteChecked": true})
}

func (app *App) pullTask(w http.ResponseWriter, id string) {
	app.store.RLock()
	task, exists := app.store.tasks[id]
	app.store.RUnlock()
	if !exists {
		jsonError(w, http.StatusNotFound, errors.New("task not found"))
		return
	}
	if task.Status == "queued" || task.Status == "running" || task.Status == "draft" {
		jsonError(w, http.StatusConflict, errors.New("task workspace is not ready for pull"))
		return
	}
	repository := taskRepository(app.config, task.ID)
	ctx, cancel := contextWithTimeout(app.config.CommandTimeout)
	defer cancel()
	status, err := runProcess(ctx, repository, "git", "status", "--porcelain")
	if err != nil {
		jsonError(w, http.StatusConflict, errors.New("task workspace is unavailable"))
		return
	}
	if strings.TrimSpace(status) != "" {
		jsonError(w, http.StatusConflict, errors.New("task workspace has uncommitted changes"))
		return
	}
	access, err := app.taskGitAccess(task, "pull")
	if err != nil {
		jsonError(w, http.StatusForbidden, err)
		return
	}
	output, err := runGitProcess(ctx, repository, access, "pull", "--ff-only")
	if err != nil {
		jsonError(w, http.StatusBadGateway, fmt.Errorf("git pull failed: %w", err))
		return
	}
	app.emitEvent(task.ID, "git.pulled", task.Status, "Task workspace updated from its remote.")
	jsonResponse(w, http.StatusOK, map[string]string{"status": "updated", "output": output})
}

func (app *App) gitAccessFor(id, repository, operation string) (gitAccess, error) {
	if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(repository)), "https://") {
		return gitAccess{}, errors.New("managed git connections require an HTTPS repository URL")
	}
	app.store.RLock()
	connection, exists := app.store.gitConnections[id]
	ciphertext := app.store.gitSecrets[id]
	app.store.RUnlock()
	if !exists {
		return gitAccess{}, errors.New("git connection not found")
	}
	if !operationAllowed(connection.Permissions, operation) {
		return gitAccess{}, fmt.Errorf("git %s permission is disabled", operation)
	}
	if !repositoryAllowed(repository, connection.RepositoryPatterns) {
		return gitAccess{}, errors.New("repository is outside the git connection allowlist")
	}
	token, err := decryptCredential(app.config.CredentialEncryptionKey, ciphertext)
	if err != nil {
		return gitAccess{}, err
	}
	return gitAccess{Connection: connection, Token: token}, nil
}

func (app *App) taskGitAccess(task Task, operation string) (gitAccess, error) {
	if task.GitConnectionID != "" {
		return app.gitAccessFor(task.GitConnectionID, task.Repository, operation)
	}
	if app.config.GitToken != "" {
		return gitAccess{Connection: GitConnection{Provider: "github", Permissions: GitPermissions{Clone: true, Pull: true, Push: true}}, Token: app.config.GitToken}, nil
	}
	return gitAccess{}, errors.New("a git connection is required for a network repository")
}

func (app *App) validateTaskGitConnection(task Task) error {
	if !isNetworkRepository(task.Repository) {
		if task.GitConnectionID != "" {
			return errors.New("gitConnectionId is only valid for a network repository")
		}
		return nil
	}
	if task.GitConnectionID == "" {
		if app.config.GitToken == "" {
			return errors.New("gitConnectionId is required for a network repository")
		}
		return nil
	}
	_, err := app.gitAccessFor(task.GitConnectionID, task.Repository, "clone")
	return err
}

func verifyGitRemote(ctx context.Context, repository string, access gitAccess) error {
	process := exec.CommandContext(ctx, "git", "ls-remote", "--heads", "--", repository)
	process.Env = gitEnvironment(access)
	output, err := process.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git remote verification failed: %s", strings.TrimSpace(string(output)))
	}
	return nil
}

func gitEnvironment(access gitAccess) []string {
	if access.Token == "" {
		return os.Environ()
	}
	username := access.Connection.Username
	if username == "" && access.Connection.Provider == "github" {
		username = "x-access-token"
	}
	if username == "" {
		username = "oauth2"
	}
	authorization := base64.StdEncoding.EncodeToString([]byte(username + ":" + access.Token))
	return append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0",
		"GIT_CONFIG_COUNT=1",
		"GIT_CONFIG_KEY_0=http.extraHeader",
		"GIT_CONFIG_VALUE_0=Authorization: Basic "+authorization,
	)
}

func encryptCredential(key, plaintext string) (string, error) {
	aead, err := credentialCipher(key)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := aead.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.RawStdEncoding.EncodeToString(sealed), nil
}

func decryptCredential(key, ciphertext string) (string, error) {
	aead, err := credentialCipher(key)
	if err != nil {
		return "", err
	}
	sealed, err := base64.RawStdEncoding.DecodeString(ciphertext)
	if err != nil || len(sealed) < aead.NonceSize() {
		return "", errors.New("stored git credential is invalid")
	}
	plaintext, err := aead.Open(nil, sealed[:aead.NonceSize()], sealed[aead.NonceSize():], nil)
	if err != nil {
		return "", errors.New("stored git credential cannot be decrypted")
	}
	return string(plaintext), nil
}

func credentialCipher(key string) (cipher.AEAD, error) {
	if len(key) < 32 {
		return nil, errors.New("git credential encryption key must contain at least 32 characters")
	}
	digest := sha256.Sum256([]byte(key))
	block, err := aes.NewCipher(digest[:])
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func validateGitConnectionInput(input gitConnectionInput, requireToken bool) error {
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Provider) == "" {
		return errors.New("name and provider are required")
	}
	if requireToken && strings.TrimSpace(input.Token) == "" {
		return errors.New("token is required")
	}
	if len(input.RepositoryPatterns) == 0 {
		return errors.New("at least one repository pattern is required")
	}
	for _, pattern := range input.RepositoryPatterns {
		if strings.TrimSpace(pattern) == "" || (strings.Contains(pattern, "*") && !strings.HasSuffix(pattern, "*")) {
			return errors.New("repository patterns support only a trailing wildcard")
		}
	}
	if !input.Permissions.Clone && !input.Permissions.Pull && !input.Permissions.Push {
		return errors.New("at least one git permission is required")
	}
	return nil
}

func normalizedProvider(provider string) string {
	return strings.ToLower(strings.TrimSpace(provider))
}

func normalizedPatterns(patterns []string) []string {
	result := make([]string, 0, len(patterns))
	for _, pattern := range patterns {
		result = append(result, strings.TrimSuffix(strings.TrimSpace(pattern), ".git"))
	}
	sort.Strings(result)
	return result
}

func repositoryAllowed(repository string, patterns []string) bool {
	repository = strings.TrimSuffix(strings.TrimSpace(repository), ".git")
	for _, pattern := range patterns {
		if pattern == "*" || repository == pattern || (strings.HasSuffix(pattern, "*") && strings.HasPrefix(repository, strings.TrimSuffix(pattern, "*"))) {
			return true
		}
	}
	return false
}

func operationAllowed(permissions GitPermissions, operation string) bool {
	switch operation {
	case "clone":
		return permissions.Clone
	case "pull":
		return permissions.Pull
	case "push":
		return permissions.Push
	default:
		return false
	}
}

func sortedGitConnections(values map[string]GitConnection) []GitConnection {
	connections := make([]GitConnection, 0, len(values))
	for _, connection := range values {
		connections = append(connections, connection)
	}
	sort.Slice(connections, func(i, j int) bool { return connections[i].Name < connections[j].Name })
	return connections
}

func parseGitConnectionPath(value string) (string, string, bool) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(value, "/api/v1/cxforge/control/git-connections/"), "/"), "/")
	if len(parts) == 1 && parts[0] != "" {
		return parts[0], "", true
	}
	if len(parts) == 2 && parts[0] != "" && parts[1] != "" {
		return parts[0], parts[1], true
	}
	return "", "", false
}
