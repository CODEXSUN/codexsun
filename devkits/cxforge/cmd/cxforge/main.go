package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/codexsun/cxforge/internal/server"
)

func main() {
	config := server.ConfigFromEnvironment()
	app := server.New(config)
	for _, port := range config.PreviewPorts {
		address := fmt.Sprintf(":%d", port)
		go func() {
			log.Printf("cxforge preview listening on %s", address)
			if err := http.ListenAndServe(address, app.PreviewHandler()); err != nil {
				log.Printf("preview listener %s stopped: %v", address, err)
			}
		}()
	}
	log.Printf("cxforge API listening on %s", config.Address)
	if err := http.ListenAndServe(config.Address, app.Handler()); err != nil {
		log.Fatal(err)
	}
}
