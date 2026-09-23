package server

import (
	"context"
	"os"
	"os/exec"
	"sync"
	"time"
)

const toolOutputLimit = 256 << 10

type toolOutput struct {
	sync.Mutex
	data      []byte
	truncated bool
}

func (out *toolOutput) Write(data []byte) (int, error) {
	out.Lock()
	defer out.Unlock()
	count := len(data)
	remaining := toolOutputLimit - len(out.data)
	if len(data) > remaining {
		out.truncated = true
		data = data[:remaining]
	}
	out.data = append(out.data, data...)
	return count, nil
}

func executeToolProcess(parent context.Context, directory string, step ToolStep) ToolResult {
	return executeToolProcessWithEnvironment(parent, directory, step, nil)
}

func executeToolProcessWithEnvironment(parent context.Context, directory string, step ToolStep, environment []string, progress ...func(string)) ToolResult {
	ctx, cancel := context.WithTimeout(parent, time.Duration(step.TimeoutSeconds)*time.Second)
	defer cancel()
	process := exec.CommandContext(ctx, step.Argv[0], step.Argv[1:]...)
	process.Dir = directory
	process.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=/tmp", "TMPDIR=/tmp", "LANG=C.UTF-8", "GIT_TERMINAL_PROMPT=0"}
	process.Env = append(process.Env, environment...)
	configureToolProcess(process)
	process.WaitDelay = time.Second
	output := &toolOutput{}
	process.Stdout, process.Stderr = output, output
	done, stopped := make(chan struct{}), make(chan struct{})
	go func() {
		defer close(stopped)
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		previous := ""
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				output.Lock()
				raw := string(output.data)
				output.Unlock()
				// Hold the trailing value length so split secret writes stay private.
				safe := redactEnvironment(raw, environment)
				hold := 0
				for _, value := range environmentValues(environment) {
					if len(value) > hold {
						hold = len(value)
					}
				}
				if len(safe) <= hold {
					continue
				}
				safe = safe[:len(safe)-hold]
				if safe != previous && len(progress) > 0 {
					progress[0](safe)
					previous = safe
				}
			}
		}
	}()
	err := process.Run()
	close(done)
	<-stopped
	code := 0
	if err != nil {
		code = -1
		if process.ProcessState != nil {
			code = process.ProcessState.ExitCode()
		}
		if ctx.Err() != nil {
			code = 124
		}
		_, _ = output.Write([]byte("\n" + err.Error()))
	}
	return ToolResult{Output: string(output.data), ExitCode: code, Truncated: output.truncated}
}
