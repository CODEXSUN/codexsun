package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

const testCredentialKey = "test-credential-encryption-key-32-characters"

func TestCredentialEncryptionRoundTrip(t *testing.T) {
	ciphertext, err := encryptCredential(testCredentialKey, "secret-token")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(ciphertext, "secret-token") {
		t.Fatal("ciphertext contains the plaintext token")
	}
	plaintext, err := decryptCredential(testCredentialKey, ciphertext)
	if err != nil || plaintext != "secret-token" {
		t.Fatalf("unexpected decrypted value %q: %v", plaintext, err)
	}
}

func TestGitConnectionAPIStoresOnlyEncryptedToken(t *testing.T) {
	config := testConfig(t)
	config.CredentialEncryptionKey = testCredentialKey
	app := New(config)
	body := `{"name":"Product GitHub","provider":"github","token":"plain-secret-token","repositoryPatterns":["https://github.com/acme/*"],"permissions":{"clone":true,"pull":true,"push":false}}`
	request := httptest.NewRequest(http.MethodPost, "/api/v1/cxforge/control/git-connections", strings.NewReader(body))
	request.Header.Set("X-CXForge-Client-Key", config.ClientKey)
	response := httptest.NewRecorder()
	app.Handler().ServeHTTP(response, request)
	if response.Code != http.StatusCreated {
		t.Fatalf("unexpected create response %d: %s", response.Code, response.Body.String())
	}
	var connection GitConnection
	if err := json.Unmarshal(response.Body.Bytes(), &connection); err != nil {
		t.Fatal(err)
	}
	if !connection.SecretConfigured || strings.Contains(response.Body.String(), "plain-secret-token") {
		t.Fatal("credential response exposed or omitted the secret state")
	}
	state, err := os.ReadFile(config.StatePath)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(state), "plain-secret-token") {
		t.Fatal("persisted state contains the plaintext token")
	}
	access, err := app.gitAccessFor(connection.ID, "https://github.com/acme/product.git", "clone")
	if err != nil || access.Token != "plain-secret-token" {
		t.Fatalf("could not resolve stored credential: %#v %v", access, err)
	}
}

func TestGitConnectionEnforcesRepositoryAndOperation(t *testing.T) {
	config := testConfig(t)
	config.CredentialEncryptionKey = testCredentialKey
	app := New(config)
	ciphertext, err := encryptCredential(testCredentialKey, "token")
	if err != nil {
		t.Fatal(err)
	}
	connection := GitConnection{
		ID: "git-1", Name: "Read only", Provider: "github",
		RepositoryPatterns: []string{"https://github.com/acme/*"},
		Permissions:        GitPermissions{Clone: true, Pull: true}, SecretConfigured: true,
	}
	app.store.gitConnections[connection.ID] = connection
	app.store.gitSecrets[connection.ID] = ciphertext
	if _, err := app.gitAccessFor(connection.ID, "https://github.com/other/product", "clone"); err == nil {
		t.Fatal("repository outside the allowlist was accepted")
	}
	if _, err := app.gitAccessFor(connection.ID, "https://github.com/acme/product", "push"); err == nil {
		t.Fatal("disabled push permission was accepted")
	}
	task := Task{Repository: "https://github.com/acme/product.git", GitConnectionID: connection.ID}
	if err := app.validateTaskGitConnection(task); err != nil {
		t.Fatalf("valid task connection was rejected: %v", err)
	}
}

func TestNetworkTaskRequiresGitConnection(t *testing.T) {
	app := New(testConfig(t))
	err := app.validateTaskGitConnection(Task{Repository: "https://github.com/acme/product.git"})
	if err == nil || !strings.Contains(err.Error(), "gitConnectionId") {
		t.Fatalf("expected a git connection error, got %v", err)
	}
}

func TestReadinessReportsMissingCredentialKey(t *testing.T) {
	app := New(testConfig(t))
	app.store.gitConnections["git-1"] = GitConnection{ID: "git-1"}
	issues := app.readinessIssues()
	if len(issues) != 1 || !strings.Contains(issues[0], "encryption key") {
		t.Fatalf("unexpected readiness issues: %#v", issues)
	}
}
