package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

func (app *App) notifyTaskOutcome(task Task) {
	if strings.TrimSpace(app.config.AlertWebhookURL) == "" {
		return
	}
	alert := task.Status == "blocked"
	alert = alert || app.config.CostAlertThresholdUSD > 0 && task.EstimatedCostUSD >= app.config.CostAlertThresholdUSD
	if !alert {
		return
	}
	go app.sendTaskAlert(task)
}

func (app *App) sendTaskAlert(task Task) {
	payload, _ := json.Marshal(map[string]any{
		"type": "cxforge.task.alert", "serverId": app.config.ServerID,
		"taskId": task.ID, "title": task.Title, "status": task.Status,
		"report": task.Report, "estimatedCostUsd": task.EstimatedCostUSD,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, app.config.AlertWebhookURL, bytes.NewReader(payload))
	if err != nil {
		return
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(request)
	if err == nil {
		_ = response.Body.Close()
	}
}
