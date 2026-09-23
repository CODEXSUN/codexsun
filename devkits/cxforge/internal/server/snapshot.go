package server

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

const maxSnapshotBytes = 512 * 1024

var excludedSnapshotDirectories = map[string]bool{
	".git": true, "node_modules": true, "dist": true, "build": true, "coverage": true, ".next": true,
}

func repositorySnapshot(repository string) (string, error) {
	var snapshot strings.Builder
	remaining := maxSnapshotBytes
	err := filepath.WalkDir(repository, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			if path != repository && excludedSnapshotDirectories[entry.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		if remaining <= 0 || !entry.Type().IsRegular() {
			return nil
		}
		if sensitiveSnapshotFile(entry.Name()) {
			return nil
		}
		info, err := entry.Info()
		if err != nil || info.Size() > int64(remaining) || info.Size() > 128*1024 {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		if bytes.IndexByte(content, 0) >= 0 {
			return nil
		}
		relative, err := filepath.Rel(repository, path)
		if err != nil {
			return err
		}
		block := fmt.Sprintf("\n--- FILE: %s ---\n%s\n", filepath.ToSlash(relative), content)
		if len(block) > remaining {
			return nil
		}
		snapshot.WriteString(block)
		remaining -= len(block)
		return nil
	})
	if err != nil {
		return "", fmt.Errorf("could not read repository snapshot: %w", err)
	}
	return snapshot.String(), nil
}

func sensitiveSnapshotFile(name string) bool {
	lower := strings.ToLower(name)
	return lower == ".env" || strings.HasPrefix(lower, ".env.") || lower == "credentials" || lower == "secrets" || strings.HasSuffix(lower, ".pem") || strings.HasSuffix(lower, ".key")
}
