package server

import (
	"errors"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

var environmentKey = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func (app *App) setWorkspaceEnvironment(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Directory string            `json:"directory"`
		Values    map[string]string `json:"values"`
		Overwrite bool              `json:"overwrite"`
	}
	if err := decode(w, r, &input); err != nil {
		jsonError(w, 400, err)
		return
	}
	if !app.workspace.TryLock() {
		jsonError(w, 409, errors.New("workspace busy"))
		return
	}
	defer app.workspace.Unlock()
	directory, err := resolveSetupDirectory(taskRepository(app.config, ""), input.Directory)
	if err != nil {
		jsonError(w, 400, err)
		return
	}
	if err := updateProjectEnvironment(directory, input.Values, input.Overwrite); err != nil {
		jsonError(w, 400, err)
		return
	}
	jsonResponse(w, 200, map[string]string{"status": "configured"})
}

func updateProjectEnvironment(directory string, values map[string]string, overwrite bool) error {
	for key, value := range values {
		if !environmentKey.MatchString(key) || strings.ContainsAny(value, "\x00\r\n") {
			return errors.New("invalid environment key or multiline value")
		}
	}
	path := filepath.Join(directory, ".env")
	for _, file := range []string{path, filepath.Join(directory, ".env.example")} {
		if info, err := os.Lstat(file); err == nil && info.Mode()&os.ModeSymlink != 0 {
			return errors.New("environment files cannot be symlinks")
		}
	}
	check := exec.Command("git", "ls-files", "--error-unmatch", ".env")
	check.Dir = directory
	if check.Run() == nil {
		return errors.New("refusing to write a tracked .env file")
	}
	data, err := os.ReadFile(path)
	existingFile := err == nil
	if os.IsNotExist(err) {
		data, err = os.ReadFile(filepath.Join(directory, ".env.example"))
		if os.IsNotExist(err) {
			data, err = nil, nil
		}
	}
	if err != nil {
		return errors.New("could not read project environment")
	}
	existing, err := parseProjectEnvironment(string(data))
	if err != nil {
		return err
	}
	lines := strings.Split(strings.TrimRight(string(data), "\r\n"), "\n")
	for key, value := range values {
		_, present := existing[key]
		if present && !overwrite && existingFile {
			continue
		}
		if present {
			for i, line := range lines {
				name, _, ok := strings.Cut(strings.TrimSpace(line), "=")
				if ok && strings.TrimSpace(name) == key {
					lines[i] = ""
				}
			}
		}
		lines = append(lines, key+"="+strconv.Quote(value))
	}
	temporary, err := os.CreateTemp(directory, ".cxforge-env-*")
	if err != nil {
		return errors.New("could not prepare environment file")
	}
	defer os.Remove(temporary.Name())
	_, writeErr := temporary.WriteString(strings.Join(lines, "\n") + "\n")
	closeErr := temporary.Close()
	if writeErr != nil || closeErr != nil {
		return errors.New("could not write environment file")
	}
	if err := os.Rename(temporary.Name(), path); err != nil {
		return errors.New("could not replace environment file")
	}
	return nil
}

func parseProjectEnvironment(data string) (map[string]string, error) {
	values := map[string]string{}
	for _, line := range strings.Split(data, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		key, value = strings.TrimSpace(key), strings.TrimSpace(value)
		if !ok || !environmentKey.MatchString(key) {
			return nil, errors.New("unsupported .env syntax; use KEY=value entries")
		}
		if strings.HasPrefix(value, "\"") {
			decoded, err := strconv.Unquote(value)
			if err != nil {
				return nil, errors.New("invalid quoted environment value")
			}
			value = decoded
		} else if strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'") {
			value = strings.Trim(value, "'")
		} else if index := strings.Index(value, " #"); index >= 0 {
			value = strings.TrimSpace(value[:index])
		}
		values[key] = value
	}
	return values, nil
}

func projectEnvironment(directory string) ([]string, error) {
	path := filepath.Join(directory, ".env")
	info, err := os.Lstat(path)
	if err != nil || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("project .env unavailable or is a symlink")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.New("cannot read .env")
	}
	values, err := parseProjectEnvironment(string(data))
	if err != nil {
		return nil, err
	}
	var result []string
	for key, value := range values {
		result = append(result, key+"="+value)
	}
	sort.Strings(result)
	return result, nil
}

func environmentValues(environment []string) map[string]string {
	values := map[string]string{}
	for _, item := range environment {
		key, value, _ := strings.Cut(item, "=")
		values[key] = value
	}
	return values
}

func redactEnvironment(output string, environment []string) string {
	for key, value := range environmentValues(environment) {
		upper := strings.ToUpper(key)
		if value != "" && (strings.Contains(upper, "PASSWORD") || strings.Contains(upper, "SECRET") || strings.Contains(upper, "TOKEN") || strings.Contains(upper, "KEY") || upper == "DATABASE_URL") {
			output = strings.ReplaceAll(output, value, "[REDACTED]")
		}
	}
	return output
}
