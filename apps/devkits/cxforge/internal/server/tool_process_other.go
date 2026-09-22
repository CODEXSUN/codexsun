//go:build !linux

package server

import "os/exec"

func configureToolProcess(process *exec.Cmd) {}
