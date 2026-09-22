package server

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

// Keep setup secrets outside task history so retries can reuse them safely.
func (app *App) saveSetupEnvironment(values map[string]string) (string, error) {
	app.control.Lock()
	defer app.control.Unlock()
	if len(values) == 0 {
		return "", nil
	}
	for key, value := range values {
		if !environmentKey.MatchString(key) || strings.ContainsAny(value, "\x00\r\n") {
			return "", errors.New("invalid environment value")
		}
	}
	data, err := json.Marshal(values)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(data)
	ref := hex.EncodeToString(digest[:])
	encrypted, err := encryptCredential(app.config.CredentialEncryptionKey, string(data))
	if err != nil {
		return "", err
	}
	directory := filepath.Join(filepath.Dir(app.config.StatePath), "setup-secrets")
	if err := os.MkdirAll(directory, 0700); err != nil {
		return "", err
	}
	// Exclusive creation makes duplicate requests safe without replacing secrets.
	file, err := os.OpenFile(filepath.Join(directory, ref), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if os.IsExist(err) {
		return ref, nil
	}
	if err != nil {
		return "", err
	}
	_, err = file.WriteString(encrypted)
	closeErr := file.Close()
	if err != nil {
		return "", err
	}
	return ref, closeErr
}

func (app *App) loadSetupEnvironment(ref string) (map[string]string, error) {
	values := map[string]string{}
	if ref == "" {
		return values, nil
	}
	decoded, err := hex.DecodeString(ref)
	if err != nil || len(decoded) != 32 {
		return nil, errors.New("invalid setup environment reference")
	}
	data, err := os.ReadFile(filepath.Join(filepath.Dir(app.config.StatePath), "setup-secrets", ref))
	if err != nil {
		return nil, errors.New("setup environment unavailable")
	}
	plain, err := decryptCredential(app.config.CredentialEncryptionKey, string(data))
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal([]byte(plain), &values)
	return values, err
}
