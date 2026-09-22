package dockerapi

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type Container struct {
	ID      string          `json:"id"`
	Name    string          `json:"name"`
	Image   string          `json:"image"`
	State   string          `json:"state"`
	Status  string          `json:"status"`
	Ports   []ContainerPort `json:"ports"`
}

type ContainerPort struct {
	IP          string `json:"ip,omitempty"`
	PrivatePort uint16 `json:"privatePort"`
	PublicPort  uint16 `json:"publicPort,omitempty"`
	Type        string `json:"type"`
}

type ContainerMetrics struct {
	CollectedAt       string `json:"collectedAt"`
	CPUPercent        float64 `json:"cpuPercent"`
	MemoryPercent     float64 `json:"memoryPercent"`
	MemoryUsageBytes  uint64  `json:"memoryUsageBytes"`
	MemoryLimitBytes  uint64  `json:"memoryLimitBytes"`
	NetworkRxBytes    uint64  `json:"networkRxBytes"`
	NetworkTxBytes    uint64  `json:"networkTxBytes"`
	BlockReadBytes    uint64  `json:"blockReadBytes"`
	BlockWriteBytes   uint64  `json:"blockWriteBytes"`
}

type ContainerSnapshot struct {
	Container Container        `json:"container"`
	Metrics   ContainerMetrics `json:"metrics"`
	Logs      []string         `json:"logs"`
}

type MariaDBSpec struct {
	HostIP string `json:"hostIp"`
	Name          string `json:"name"`
	Image         string `json:"image"`
	Network       string `json:"network"`
	HostPort      string `json:"hostPort"`
	ContainerPort string `json:"containerPort"`
	RootPassword  string `json:"rootPassword"`
	DataVolume    string `json:"dataVolume"`
	BackupVolume  string `json:"backupVolume"`
	Database      string `json:"database"`
	RestartPolicy string `json:"restartPolicy"`
}

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(socketPath string) *Client {
	transport := &http.Transport{
		DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return (&net.Dialer{Timeout: 5 * time.Second}).DialContext(ctx, "unix", socketPath)
		},
	}
	return &Client{
		baseURL: "http://docker",
		http:    &http.Client{Transport: transport, Timeout: 5 * time.Minute},
	}
}

func (client *Client) Ping() error {
	response, err := client.request(http.MethodGet, "/v1.41/_ping")
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("Docker daemon ping returned %s", response.Status)
	}
	return nil
}

func (client *Client) ListContainers() ([]Container, error) {
	response, err := client.request(http.MethodGet, "/v1.41/containers/json?all=1")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if err := readDockerError(response); err != nil {
		return nil, err
	}
	var rows []struct {
		ID     string `json:"Id"`
		Names  []string `json:"Names"`
		Image  string `json:"Image"`
		State  string `json:"State"`
		Status string `json:"Status"`
		Ports  []struct {
			IP          string `json:"IP"`
			PrivatePort uint16 `json:"PrivatePort"`
			PublicPort  uint16 `json:"PublicPort"`
			Type        string `json:"Type"`
		} `json:"Ports"`
	}
	if err := json.NewDecoder(response.Body).Decode(&rows); err != nil {
		return nil, fmt.Errorf("decode Docker container list: %w", err)
	}
	containers := make([]Container, 0, len(rows))
	for _, row := range rows {
		name := ""
		if len(row.Names) > 0 {
			name = strings.TrimPrefix(row.Names[0], "/")
		}
		container := Container{ID: row.ID, Name: name, Image: row.Image, State: row.State, Status: row.Status, Ports: make([]ContainerPort, 0, len(row.Ports))}
		for _, port := range row.Ports {
			container.Ports = append(container.Ports, ContainerPort{
				IP: port.IP, PrivatePort: port.PrivatePort, PublicPort: port.PublicPort, Type: port.Type,
			})
		}
		containers = append(containers, container)
	}
	return containers, nil
}

func (client *Client) Action(id, action string) error {
	response, err := client.request(http.MethodPost, "/v1.41/containers/"+id+"/"+action)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotModified || response.StatusCode == http.StatusNoContent {
		return nil
	}
	return readDockerError(response)
}

func (client *Client) InstallMariaDB(spec MariaDBSpec) (Container, error) {
	if err := client.PullImage(spec.Image); err != nil {
		return Container{}, err
	}
	if err := client.ensureNetwork(spec.Network); err != nil {
		return Container{}, err
	}
	for _, volume := range []string{spec.DataVolume, spec.BackupVolume} {
		if err := client.ensureVolume(volume); err != nil {
			return Container{}, err
		}
	}
	if existing, err := client.findContainer(spec.Name); err != nil {
		return Container{}, err
	} else if existing.ID != "" {
		return Container{}, fmt.Errorf("Docker container %s already exists", spec.Name)
	}
	request := createContainerRequest{
		Image: spec.Image,
		Env: []string{
			"MARIADB_ROOT_PASSWORD=" + spec.RootPassword,
			"MARIADB_ROOT_HOST=%",
			"MARIADB_DATABASE=" + spec.Database,
		},
		ExposedPorts: map[string]struct{}{spec.ContainerPort + "/tcp": {}},
		HostConfig: hostConfig{
			Binds: []string{spec.DataVolume + ":/var/lib/mysql", spec.BackupVolume + ":/backups"},
			PortBindings: map[string][]portBinding{
				spec.ContainerPort + "/tcp": {{HostIP: defaultHostIP(spec.HostIP), HostPort: spec.HostPort}},
			},
			RestartPolicy: restartPolicy{Name: spec.RestartPolicy},
		},
		NetworkingConfig: networkingConfig{EndpointsConfig: map[string]endpointSettings{spec.Network: {}}},
	}
	var created struct {
		ID string `json:"Id"`
	}
	if err := client.requestJSON(http.MethodPost, "/v1.41/containers/create?name="+url.QueryEscape(spec.Name), request, &created); err != nil {
		return Container{}, err
	}
	if err := client.Action(created.ID, "start"); err != nil {
		return Container{}, err
	}
	return client.findContainer(spec.Name)
}

func defaultHostIP(hostIP string) string {
	if hostIP == "" {
		return "127.0.0.1"
	}
	return hostIP
}

func (client *Client) PullImage(image string) error {
	response, err := client.request(http.MethodPost, "/v1.41/images/create?fromImage="+url.QueryEscape(image))
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if err := readDockerError(response); err != nil {
		return err
	}
	if _, err := io.Copy(io.Discard, response.Body); err != nil {
		return fmt.Errorf("read Docker image pull response: %w", err)
	}
	return nil
}

func (client *Client) DropMariaDB(spec MariaDBSpec) error {
	container, err := client.findContainer(spec.Name)
	if err != nil {
		return err
	}
	if container.ID != "" {
		response, requestErr := client.request(http.MethodDelete, "/v1.41/containers/"+container.ID+"?force=true&v=true")
		if requestErr != nil {
			return requestErr
		}
		defer response.Body.Close()
		if err := readDockerError(response); err != nil {
			return err
		}
	}
	for _, volume := range []string{spec.DataVolume, spec.BackupVolume} {
		response, requestErr := client.request(http.MethodDelete, "/v1.41/volumes/"+url.PathEscape(volume))
		if requestErr != nil {
			return requestErr
		}
		if response.StatusCode != http.StatusNotFound {
			if err := readDockerError(response); err != nil {
				return err
			}
		}
		response.Body.Close()
	}
	return nil
}

func (client *Client) ReinstallMariaDB(spec MariaDBSpec) (Container, error) {
	if err := client.DropMariaDB(spec); err != nil {
		return Container{}, err
	}
	return client.InstallMariaDB(spec)
}

func LoadMariaDBSpec(path, password string) (MariaDBSpec, error) {
	body, err := os.ReadFile(path)
	if err != nil {
		return MariaDBSpec{}, fmt.Errorf("read MariaDB sample: %w", err)
	}
	var spec MariaDBSpec
	if err := json.Unmarshal(body, &spec); err != nil {
		return MariaDBSpec{}, fmt.Errorf("decode MariaDB sample: %w", err)
	}
	if password != "" {
		spec.RootPassword = password
	}
	return spec, nil
}

func (client *Client) Snapshot(id string) (ContainerSnapshot, error) {
	containers, err := client.ListContainers()
	if err != nil {
		return ContainerSnapshot{}, err
	}
	var container Container
	for _, candidate := range containers {
		if candidate.ID == id || strings.HasPrefix(candidate.ID, id) {
			container = candidate
			break
		}
	}
	if container.ID == "" {
		return ContainerSnapshot{}, fmt.Errorf("Docker container %s was not found", id)
	}
	metrics, err := client.Stats(id)
	if err != nil {
		return ContainerSnapshot{}, err
	}
	logs, err := client.Logs(id)
	if err != nil {
		return ContainerSnapshot{}, err
	}
	return ContainerSnapshot{Container: container, Metrics: metrics, Logs: logs}, nil
}

func (client *Client) Stats(id string) (ContainerMetrics, error) {
	response, err := client.request(http.MethodGet, "/v1.41/containers/"+id+"/stats?stream=false&one-shot=true")
	if err != nil {
		return ContainerMetrics{}, err
	}
	defer response.Body.Close()
	if err := readDockerError(response); err != nil {
		return ContainerMetrics{}, err
	}
	var stats dockerStats
	if err := json.NewDecoder(response.Body).Decode(&stats); err != nil {
		return ContainerMetrics{}, fmt.Errorf("decode Docker stats: %w", err)
	}
	return stats.metrics(), nil
}

func (client *Client) Logs(id string) ([]string, error) {
	response, err := client.request(http.MethodGet, "/v1.41/containers/"+id+"/logs?stdout=1&stderr=1&timestamps=1&tail=100")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if err := readDockerError(response); err != nil {
		return nil, err
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, 256*1024))
	if err != nil {
		return nil, fmt.Errorf("read Docker logs: %w", err)
	}
	lines := strings.Split(strings.ReplaceAll(decodeLogStream(body), "\r\n", "\n"), "\n")
	filtered := make([]string, 0, len(lines))
	for _, line := range lines {
		if line != "" {
			filtered = append(filtered, sanitizeLogLine(line))
		}
	}
	return filtered, nil
}

func decodeLogStream(body []byte) string {
	var decoded strings.Builder
	offset := 0
	for offset+8 <= len(body) {
		if body[offset+1] != 0 || body[offset+2] != 0 || body[offset+3] != 0 {
			return string(body)
		}
		length := int(binary.BigEndian.Uint32(body[offset+4 : offset+8]))
		start := offset + 8
		end := start + length
		if end > len(body) {
			return string(body)
		}
		decoded.Write(body[start:end])
		offset = end
	}
	if offset != len(body) {
		return string(body)
	}
	return decoded.String()
}

func sanitizeLogLine(line string) string {
	return strings.Map(func(r rune) rune {
		if r < 0x20 && r != '\t' {
			return -1
		}
		if r == 0x7f {
			return -1
		}
		return r
	}, line)
}

func (client *Client) request(method, path string) (*http.Response, error) {
	request, err := http.NewRequest(method, client.baseURL+path, nil)
	if err != nil {
		return nil, err
	}
	response, err := client.http.Do(request)
	if err != nil {
		return nil, fmt.Errorf("connect to Docker daemon: %w", err)
	}
	return response, nil
}

func (client *Client) requestJSON(method, path string, payload any, result any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode Docker request: %w", err)
	}
	request, err := http.NewRequest(method, client.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := client.http.Do(request)
	if err != nil {
		return fmt.Errorf("connect to Docker daemon: %w", err)
	}
	defer response.Body.Close()
	if err := readDockerError(response); err != nil {
		return err
	}
	if result == nil {
		return nil
	}
	if err := json.NewDecoder(response.Body).Decode(result); err != nil {
		return fmt.Errorf("decode Docker response: %w", err)
	}
	return nil
}

func (client *Client) ensureNetwork(name string) error {
	response, err := client.request(http.MethodGet, "/v1.41/networks/"+url.PathEscape(name))
	if err != nil {
		return err
	}
	if response.StatusCode == http.StatusOK {
		response.Body.Close()
		return nil
	}
	if response.StatusCode != http.StatusNotFound {
		return readDockerError(response)
	}
	response.Body.Close()
	return client.requestJSON(http.MethodPost, "/v1.41/networks/create", map[string]string{"Name": name, "Driver": "bridge"}, nil)
}

func (client *Client) ensureVolume(name string) error {
	response, err := client.request(http.MethodGet, "/v1.41/volumes/"+url.PathEscape(name))
	if err != nil {
		return err
	}
	if response.StatusCode == http.StatusOK {
		response.Body.Close()
		return nil
	}
	if response.StatusCode != http.StatusNotFound {
		return readDockerError(response)
	}
	response.Body.Close()
	return client.requestJSON(http.MethodPost, "/v1.41/volumes/create", map[string]string{"Name": name, "Driver": "local"}, nil)
}

func (client *Client) findContainer(name string) (Container, error) {
	containers, err := client.ListContainers()
	if err != nil {
		return Container{}, err
	}
	for _, container := range containers {
		if container.Name == name {
			return container, nil
		}
	}
	return Container{}, nil
}

func readDockerError(response *http.Response) error {
	if response.StatusCode >= 200 && response.StatusCode < 300 {
		return nil
	}
	body, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
	message := strings.TrimSpace(string(body))
	if message == "" {
		message = response.Status
	}
	return fmt.Errorf("Docker daemon: %s", message)
}

type dockerStats struct {
	CPUStats struct {
		CPUUsage struct {
			TotalUsage uint64 `json:"total_usage"`
		} `json:"cpu_usage"`
		SystemUsage uint64 `json:"system_cpu_usage"`
		OnlineCPUs  uint64 `json:"online_cpus"`
	} `json:"cpu_stats"`
	PreCPUStats struct {
		CPUUsage struct {
			TotalUsage uint64 `json:"total_usage"`
		} `json:"cpu_usage"`
		SystemUsage uint64 `json:"system_cpu_usage"`
	} `json:"precpu_stats"`
	MemoryStats struct {
		Usage uint64 `json:"usage"`
		Limit uint64 `json:"limit"`
	} `json:"memory_stats"`
	Networks map[string]struct {
		RxBytes uint64 `json:"rx_bytes"`
		TxBytes uint64 `json:"tx_bytes"`
	} `json:"networks"`
	BlkioStats struct {
		IoServiceBytesRecursive []struct {
			Op    string `json:"op"`
			Value uint64 `json:"value"`
		} `json:"io_service_bytes_recursive"`
	} `json:"blkio_stats"`
}

type createContainerRequest struct {
	Image           string                   `json:"Image"`
	Env             []string                 `json:"Env"`
	ExposedPorts    map[string]struct{}      `json:"ExposedPorts"`
	HostConfig      hostConfig               `json:"HostConfig"`
	NetworkingConfig networkingConfig        `json:"NetworkingConfig"`
}

type hostConfig struct {
	Binds         []string                         `json:"Binds"`
	PortBindings  map[string][]portBinding          `json:"PortBindings"`
	RestartPolicy restartPolicy                    `json:"RestartPolicy"`
}

type portBinding struct {
	HostIP   string `json:"HostIp"`
	HostPort string `json:"HostPort"`
}

type restartPolicy struct {
	Name string `json:"Name"`
}

type networkingConfig struct {
	EndpointsConfig map[string]endpointSettings `json:"EndpointsConfig"`
}

type endpointSettings struct{}

func (stats dockerStats) metrics() ContainerMetrics {
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage - stats.PreCPUStats.SystemUsage)
	cpuPercent := 0.0
	if systemDelta > 0 {
		cpus := stats.CPUStats.OnlineCPUs
		if cpus == 0 {
			cpus = 1
		}
		cpuPercent = (cpuDelta / systemDelta) * float64(cpus) * 100
	}
	networkRx, networkTx := uint64(0), uint64(0)
	for _, network := range stats.Networks {
		networkRx += network.RxBytes
		networkTx += network.TxBytes
	}
	blockRead, blockWrite := uint64(0), uint64(0)
	for _, item := range stats.BlkioStats.IoServiceBytesRecursive {
		switch strings.ToLower(item.Op) {
		case "read":
			blockRead += item.Value
		case "write":
			blockWrite += item.Value
		}
	}
	memoryPercent := 0.0
	if stats.MemoryStats.Limit > 0 {
		memoryPercent = float64(stats.MemoryStats.Usage) / float64(stats.MemoryStats.Limit) * 100
	}
	return ContainerMetrics{
		CollectedAt:      time.Now().UTC().Format(time.RFC3339),
		CPUPercent:       cpuPercent,
		MemoryPercent:    memoryPercent,
		MemoryUsageBytes: stats.MemoryStats.Usage,
		MemoryLimitBytes: stats.MemoryStats.Limit,
		NetworkRxBytes:   networkRx,
		NetworkTxBytes:   networkTx,
		BlockReadBytes:   blockRead,
		BlockWriteBytes:  blockWrite,
	}
}
