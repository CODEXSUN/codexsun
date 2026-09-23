package server

import (
	"os"
	"path/filepath"
)

// App-local values override checkout defaults. Missing .env files are allowed.
func commandEnvironment(repository, directory string) ([]string, error) {
	values := map[string]string{}
	paths := []string{repository}
	if directory != repository {
		paths = append(paths, directory)
	}
	for _, path := range paths {
		if _, err := os.Lstat(filepath.Join(path, ".env")); os.IsNotExist(err) {
			continue
		}
		environment, err := projectEnvironment(path)
		if err != nil {
			return nil, err
		}
		for key, value := range environmentValues(environment) {
			values[key] = value
		}
	}
	var result []string
	for key, value := range values {
		result = append(result, key+"="+value)
	}
	return result, nil
}
