package server

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const maxPolicyBytes = 64 * 1024

type repositoryPolicy struct {
	TestCommand    string `json:"testCommand"`
	PreviewCommand string `json:"previewCommand"`
}

func loadRepositoryPolicy(repository string, config Config) (repositoryPolicy, error) {
	policy := repositoryPolicy{TestCommand: config.TestCommand, PreviewCommand: config.PreviewCommand}
	if !config.AllowRepoCommands {
		return policy, nil
	}
	file, err := os.Open(filepath.Join(repository, ".cxforge.json"))
	if os.IsNotExist(err) {
		return policy, nil
	}
	if err != nil {
		return policy, err
	}
	defer file.Close()
	decoder := json.NewDecoder(io.LimitReader(file, maxPolicyBytes))
	decoder.DisallowUnknownFields()
	var declared repositoryPolicy
	if err := decoder.Decode(&declared); err != nil {
		return policy, fmt.Errorf("invalid .cxforge.json: %w", err)
	}
	if strings.TrimSpace(declared.TestCommand) != "" {
		policy.TestCommand = declared.TestCommand
	}
	if strings.TrimSpace(declared.PreviewCommand) != "" {
		policy.PreviewCommand = declared.PreviewCommand
	}
	return policy, nil
}
