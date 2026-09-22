package server

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSetupEnvironmentPreservesAndRedacts(t *testing.T) {
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, ".env.example"), []byte("DB_DRIVER=sqlite\nNAME=original\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := updateProjectEnvironment(directory, nil, false); err != nil {
		t.Fatal(err)
	}
	if err := updateProjectEnvironment(directory, map[string]string{"NAME": "changed", "DB_PASSWORD": "private-value"}, false); err != nil {
		t.Fatal(err)
	}
	env, err := projectEnvironment(directory)
	if err != nil {
		t.Fatal(err)
	}
	if environmentValues(env)["NAME"] != "original" {
		t.Fatal("existing value overwritten")
	}
	if strings.Contains(redactEnvironment("failure private-value", env), "private-value") {
		t.Fatal("secret leaked")
	}
	if err := updateProjectEnvironment(directory, map[string]string{"NAME": "changed"}, true); err != nil {
		t.Fatal(err)
	}
	env, _ = projectEnvironment(directory)
	if environmentValues(env)["NAME"] != "changed" {
		t.Fatal("explicit update not applied")
	}
}

func TestSQLiteDefaultAndIntegrity(t *testing.T) {
	if _, err := os.Stat("/usr/bin/python3"); err != nil {
		t.Skip("requires Python")
	}
	directory := t.TempDir()
	path, err := resolveSQLitePath(directory, ".cxforge/database.sqlite")
	if err != nil {
		t.Fatal(err)
	}
	environment := []string{"DB_DRIVER=sqlite", "CXFORGE_SQLITE_PATH=" + path}
	if err := checkWorkspaceDatabase(context.Background(), environment); err != nil {
		t.Fatal(err)
	}
	if err := checkWorkspaceDatabase(context.Background(), environment); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatal(err)
	}
	if _, err := resolveSQLitePath(directory, "../outside.sqlite"); err == nil {
		t.Fatal("escaped path accepted")
	}
}

func TestMariaDBDoesNotFallbackToSQLite(t *testing.T) {
	err := checkWorkspaceDatabase(context.Background(), []string{"DB_DRIVER=mariadb"})
	if err == nil || !strings.Contains(err.Error(), "shared MariaDB requires") {
		t.Fatalf("unexpected error %v", err)
	}
}

func TestFlatWorkspaceAndSeparateState(t *testing.T) {
	config := testConfig(t)
	app := New(config)
	repository, err := app.prepareRepository(context.Background(), Task{ID: "flat-root", Repository: "demo"})
	if err != nil {
		t.Fatal(err)
	}
	if repository != config.WorkspaceRoot {
		t.Fatal("checkout is not the workspace root")
	}
	if within(repository, config.StatePath) {
		t.Fatal("worker state must stay outside checkout")
	}
}

func TestSetupSecretsAreEncryptedAndStable(t *testing.T) {
	config := testConfig(t)
	config.CredentialEncryptionKey = "test-credential-encryption-key-32characters"
	app := New(config)
	values := map[string]string{"DB_PASSWORD": "not-for-task-history"}
	first, err := app.saveSetupEnvironment(values)
	if err != nil {
		t.Fatal(err)
	}
	second, err := app.saveSetupEnvironment(values)
	if err != nil || first != second {
		t.Fatal("duplicate environment changed reference")
	}
	saved, err := app.loadSetupEnvironment(first)
	if err != nil || saved["DB_PASSWORD"] != values["DB_PASSWORD"] {
		t.Fatal("secret round trip failed")
	}
	data, err := os.ReadFile(filepath.Join(filepath.Dir(config.StatePath), "setup-secrets", first))
	if err != nil || strings.Contains(string(data), values["DB_PASSWORD"]) {
		t.Fatal("plaintext secret stored")
	}
}

func TestNoDatabaseNeedsNoConnection(t *testing.T) {
	if err := checkWorkspaceDatabase(context.Background(), []string{"DB_DRIVER=none"}); err != nil {
		t.Fatal(err)
	}
}
