package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/codexsun/orship-docker/internal/dockerapi"
)

func main() {
	client := dockerapi.NewClient(env("ORSHIP_DOCKER_SOCKET", "/var/run/docker.sock"))
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		if err := client.Ping(); err != nil {
			log.Fatal(err)
		}
		return
	}
	if len(os.Args) > 1 {
		log.Fatalf("unknown command: %s", os.Args[1])
	}

	token := os.Getenv("ORSHIP_DOCKER_TOKEN")
	if token == "" {
		log.Fatal("ORSHIP_DOCKER_TOKEN is required")
	}
	sample, err := dockerapi.LoadMariaDBSpec(
		env("ORSHIP_MARIADB_SAMPLE_PATH", "/etc/orship/samples/mariadb.json"),
		os.Getenv("ORSHIP_MARIADB_SAMPLE_ROOT_PASSWORD"),
	)
	if err != nil {
		log.Fatal(err)
	}
	address := env("ORSHIP_DOCKER_ADDRESS", ":6302")
	server := &http.Server{
		Addr:              address,
		Handler:           dockerapi.NewHandler(client, token, sample),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("Orship Docker manager listening on %s", address)
	log.Fatal(server.ListenAndServe())
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
