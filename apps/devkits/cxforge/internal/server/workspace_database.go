package server

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
)

func resolveSQLitePath(directory, relative string) (string, error) {
	path := filepath.Join(directory, relative)
	parent := filepath.Dir(path)
	ancestor := parent
	for {
		if _, err := os.Lstat(ancestor); err == nil {
			break
		}
		next := filepath.Dir(ancestor)
		if next == ancestor {
			return "", errors.New("database parent unavailable")
		}
		ancestor = next
	}
	resolved, err := filepath.EvalSymlinks(ancestor)
	if err != nil || !within(directory, resolved) || !within(directory, path) {
		return "", errors.New("database path outside project")
	}
	if info, err := os.Lstat(path); err == nil && info.Mode()&os.ModeSymlink != 0 {
		return "", errors.New("database cannot be a symlink")
	}
	if err := os.MkdirAll(parent, 0700); err != nil {
		return "", err
	}
	return path, nil
}

func checkWorkspaceDatabase(parent context.Context, environment []string) error {
	ctx, cancel := contextWithTimeout(20)
	defer cancel()
	// Honor the enclosing task cancellation as well as the connection timeout.
	stop := context.AfterFunc(parent, cancel)
	defer stop()
	values := environmentValues(environment)
	if values["DB_DRIVER"] == "none" {
		return nil
	}
	if values["DB_DRIVER"] == "sqlite" {
		command := exec.CommandContext(ctx, "python3", "-c", "import sqlite3,os; c=sqlite3.connect(os.environ['CXFORGE_SQLITE_PATH'],timeout=5); assert c.execute('PRAGMA quick_check').fetchone()[0]=='ok'; c.execute('PRAGMA journal_mode=WAL'); c.close()")
		command.Env = append([]string{"PATH=" + os.Getenv("PATH")}, environment...)
		if command.Run() != nil {
			return errors.New("SQLite connection or integrity check failed")
		}
		return nil
	}
	for _, key := range []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_MASTER_NAME"} {
		if values[key] == "" {
			return errors.New("shared MariaDB requires DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_MASTER_NAME in project .env")
		}
	}
	port, err := strconv.Atoi(values["DB_PORT"])
	if err != nil || port < 1 || port > 65535 {
		return errors.New("invalid MariaDB port")
	}
	file, err := os.CreateTemp("", "cxforge-mariadb-*")
	if err != nil {
		return errors.New("could not prepare database connection")
	}
	defer os.Remove(file.Name())
	_, err = file.WriteString("[client]\npassword=" + strconv.Quote(values["DB_PASSWORD"]) + "\n")
	_ = file.Close()
	if err != nil {
		return errors.New("could not prepare database connection")
	}
	command := exec.CommandContext(ctx, "mariadb", "--defaults-extra-file="+file.Name(), "--protocol=tcp", "--connect-timeout=10", "--host="+values["DB_HOST"], "--port="+values["DB_PORT"], "--user="+values["DB_USER"], "--database="+values["DB_MASTER_NAME"], "--execute=SELECT 1")
	if command.Run() != nil {
		return errors.New("shared MariaDB authentication or connection check failed")
	}
	return nil
}
