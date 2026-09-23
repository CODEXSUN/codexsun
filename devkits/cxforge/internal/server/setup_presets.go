package server

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func (app *App) recordSetupRepository(ctx context.Context, task *Task) {
	commit, _ := runProcess(ctx, app.config.WorkspaceRoot, "git", "rev-parse", "HEAD")
	input := task.Tools.Setup.Repository
	app.store.Lock()
	var profile RepositoryProfile
	for _, existing := range app.store.repositories {
		profile = existing
		break
	}
	if profile.ID == "" {
		profile.ID = newID()
	}
	profile.Name, profile.Repository, profile.GitConnectionID = input.Name, input.Repository, input.GitConnectionID
	profile.DefaultBranch, profile.CommitSHA, profile.WorkspaceStatus = input.DefaultBranch, commit, "ready"
	app.store.repositories[profile.ID] = profile
	task.RepositoryProfileID, task.BaseCommitSHA = profile.ID, commit
	app.store.tasks[task.ID] = *task
	app.store.Unlock()
	app.saveState()
}

func excludeSetupFiles(repository string) error {
	path := filepath.Join(repository, ".git", "info", "exclude")
	data, err := os.ReadFile(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	if strings.Contains(string(data), "# CXForge runtime files") {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	data = append(data, []byte("\n# CXForge runtime files\n.env\n.cxforge/\n")...)
	return os.WriteFile(path, data, 0600)
}

func installZunoPreset(repository string) error {
	directory := filepath.Join(repository, ".cxforge")
	if err := os.MkdirAll(directory, 0700); err != nil {
		return err
	}
	resolved, err := filepath.EvalSymlinks(directory)
	if err != nil || !within(repository, resolved) {
		return errors.New("preset directory outside workspace")
	}
	for _, name := range []string{"zuno-migrations.ts", "zuno-preview.mjs"} {
		data, err := os.ReadFile(filepath.Join("/opt/cxforge/presets", name))
		if err != nil {
			return errors.New("bundled Zuno preset unavailable")
		}
		target := filepath.Join(directory, name)
		if info, err := os.Lstat(target); err == nil && info.Mode()&os.ModeSymlink != 0 {
			return errors.New("preset cannot replace symlink")
		}
		if err := os.WriteFile(target, data, 0600); err != nil {
			return err
		}
	}
	return nil
}
