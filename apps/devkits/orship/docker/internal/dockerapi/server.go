package dockerapi

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

var containerIDPattern = regexp.MustCompile(`^[a-f0-9]{12,64}$`)
var actions = map[string]bool{"start": true, "stop": true, "restart": true}

type handler struct {
	client *Client
	mariadb MariaDBSpec
	token  string
}

func NewHandler(client *Client, token string, mariadb MariaDBSpec) http.Handler {
	return (&handler{client: client, mariadb: mariadb, token: token}).routes()
}

func (api *handler) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", api.health)
	mux.HandleFunc("GET /containers", api.listContainers)
	mux.HandleFunc("GET /containers/{id}/snapshot", api.containerSnapshot)
	mux.HandleFunc("POST /containers/{id}/{action}", api.containerAction)
	mux.HandleFunc("POST /samples/mariadb/install", api.installMariaDB)
	mux.HandleFunc("POST /samples/mariadb/reinstall", api.reinstallMariaDB)
	mux.HandleFunc("POST /samples/mariadb/drop", api.dropMariaDB)
	return api.authenticate(mux)
}

func (api *handler) health(writer http.ResponseWriter, request *http.Request) {
	if err := api.client.Ping(); err != nil {
		writeError(writer, http.StatusServiceUnavailable, err.Error())
		return
	}
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func (api *handler) listContainers(writer http.ResponseWriter, _ *http.Request) {
	containers, err := api.client.ListContainers()
	if err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusOK, map[string][]Container{"containers": containers})
}

func (api *handler) containerSnapshot(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	if !containerIDPattern.MatchString(id) {
		writeError(writer, http.StatusBadRequest, "Container id is invalid.")
		return
	}
	snapshot, err := api.client.Snapshot(id)
	if err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusOK, snapshot)
}

func (api *handler) containerAction(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	action := request.PathValue("action")
	if !containerIDPattern.MatchString(id) || !actions[action] {
		writeError(writer, http.StatusBadRequest, "Container id or action is invalid.")
		return
	}
	if err := api.client.Action(id, action); err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusOK, map[string]string{"status": "accepted", "action": action})
}

func (api *handler) installMariaDB(writer http.ResponseWriter, _ *http.Request) {
	container, err := api.client.InstallMariaDB(api.mariadb)
	if err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusCreated, map[string]any{"container": container, "sample": publicMariaDBSpec(api.mariadb)})
}

func (api *handler) reinstallMariaDB(writer http.ResponseWriter, _ *http.Request) {
	container, err := api.client.ReinstallMariaDB(api.mariadb)
	if err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusCreated, map[string]any{"container": container, "sample": publicMariaDBSpec(api.mariadb)})
}

func (api *handler) dropMariaDB(writer http.ResponseWriter, _ *http.Request) {
	if err := api.client.DropMariaDB(api.mariadb); err != nil {
		writeError(writer, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(writer, http.StatusOK, map[string]string{"status": "dropped", "name": api.mariadb.Name})
}

func publicMariaDBSpec(spec MariaDBSpec) map[string]string {
	return map[string]string{
		"backupVolume": spec.BackupVolume,
		"containerPort": spec.ContainerPort,
		"dataVolume": spec.DataVolume,
		"database": spec.Database,
		"hostIp": spec.HostIP,
		"hostPort": spec.HostPort,
		"image": spec.Image,
		"name": spec.Name,
		"network": spec.Network,
		"restartPolicy": spec.RestartPolicy,
	}
}

func (api *handler) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		provided := strings.TrimPrefix(request.Header.Get("Authorization"), "Bearer ")
		if len(provided) != len(api.token) || subtle.ConstantTimeCompare([]byte(provided), []byte(api.token)) != 1 {
			writeError(writer, http.StatusUnauthorized, "Authentication required.")
			return
		}
		next.ServeHTTP(writer, request)
	})
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		fmt.Printf("encode response: %v\n", err)
	}
}

func writeError(writer http.ResponseWriter, status int, message string) {
	writeJSON(writer, status, map[string]string{"error": message})
}
