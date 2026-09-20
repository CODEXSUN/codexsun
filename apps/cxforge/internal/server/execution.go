package server

import (
    "bytes"
    "context"
    "encoding/json"
    "errors"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "strings"
    "time"
)

type modelInput struct { Prompt string `json:"prompt"`; Repository string `json:"repository"`; OwnedPaths []string `json:"ownedPaths"` }
type modelOutput struct { Files []struct { Path string `json:"path"`; Content string `json:"content"` } `json:"files"`; Summary string `json:"summary"` }

func runModel(ctx context.Context, command string, input modelInput) (modelOutput, error) {
    if strings.TrimSpace(command) == "" { return modelOutput{}, errors.New("CXFORGE_MODEL_COMMAND is not configured") }
    payload, _ := json.Marshal(input)
    process := exec.CommandContext(ctx, "sh", "-lc", command)
    process.Stdin = bytes.NewReader(payload)
    output, err := process.Output()
    if err != nil { return modelOutput{}, fmt.Errorf("model command failed: %w", err) }
    var result modelOutput
    if err := json.Unmarshal(output, &result); err != nil { return modelOutput{}, errors.New("model command must return JSON with files and summary") }
    return result, nil
}

func applyFiles(repository string, owned []string, files []struct { Path string `json:"path"`; Content string `json:"content"` }) ([]string, error) {
    allowed := map[string]bool{}; for _, path := range owned { allowed[filepath.Clean(path)] = true }
    changed := make([]string, 0, len(files))
    for _, file := range files { path := filepath.Clean(file.Path); if !allowed[path] { return changed, fmt.Errorf("model attempted to edit unowned path %q", file.Path) }; target := filepath.Join(repository, path); if !within(repository, target) { return changed, fmt.Errorf("model attempted to escape repository with %q", file.Path) }; if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil { return changed, err }; if err := os.WriteFile(target, []byte(file.Content), 0o644); err != nil { return changed, err }; changed = append(changed, path) }
    return changed, nil
}

func runCommand(ctx context.Context, command, directory string) (string, error) { if strings.TrimSpace(command) == "" { return "skipped: no verification command configured", nil }; process := exec.CommandContext(ctx, "sh", "-lc", command); process.Dir = directory; output, err := process.CombinedOutput(); text := strings.TrimSpace(string(output)); if err != nil { return text, fmt.Errorf("verification failed: %w", err) }; return text, nil }
func contextWithTimeout(seconds int) (context.Context, context.CancelFunc) { if seconds < 1 { seconds = 300 }; return context.WithTimeout(context.Background(), time.Duration(seconds)*time.Second) }
