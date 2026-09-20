package main

import (
    "log"
    "net/http"
    "github.com/codexsun/cxforge/internal/server"
)

func main() {
    config := server.ConfigFromEnvironment()
    log.Printf("cxforge listening on %s", config.Address)
    if err := http.ListenAndServe(config.Address, server.New(config).Handler()); err != nil { log.Fatal(err) }
}
