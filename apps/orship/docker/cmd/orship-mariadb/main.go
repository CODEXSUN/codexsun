package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	config := flag.String("config", "", "path to a MariaDB env file")
	configs := flag.String("configs", "", "JSON array of MariaDB env file paths for install-all")
	script := flag.String("script", "", "path to mariadb-setup.sh")
	flag.Parse()
	if flag.NArg() != 1 {
		fail("usage: orship-mariadb --config <env-file> <command> or --configs <json> install-all")
	}

	command := flag.Arg(0)
	scriptPath := *script
	if scriptPath == "" {
		scriptPath = filepath.Join("scripts", "mariadb-setup.sh")
	}
	if command == "install-all" {
		if *configs == "" {
			fail("--configs is required for install-all")
		}
		installAll(scriptPath, *configs)
		return
	}
	if *config == "" {
		fail("--config is required")
	}
	args := []string{scriptPath, command, *config}
	if flag.NArg() > 1 {
		args = append(args, flag.Arg(1))
	}
	run(args...)
}

func installAll(scriptPath, listPath string) {
	body, err := os.ReadFile(listPath)
	if err != nil {
		fail("read config list: %v", err)
	}
	var configs []string
	if err := json.Unmarshal(body, &configs); err != nil {
		fail("decode config list: %v", err)
	}
	if len(configs) == 0 {
		fail("config list is empty")
	}
	for _, config := range configs {
		if config == "" {
			fail("config list contains an empty path")
		}
		run(scriptPath, "install", config)
	}
}

func run(args ...string) {
	command := exec.Command("sh", args...)
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	if err := command.Run(); err != nil {
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			os.Exit(exitError.ExitCode())
		}
		fail("run MariaDB command: %v", err)
	}
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(2)
}
