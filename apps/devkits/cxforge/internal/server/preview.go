package server

import (
	"fmt"
	"html/template"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

var previewTemplate = template.Must(template.New("preview").Parse(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>{{.Title}} · CXForge preview</title><style>
body{margin:0;background:#0f1512;color:#edf7f0;font:15px system-ui,sans-serif}main{max-width:780px;margin:10vh auto;padding:32px;border:1px solid #2f4438;border-radius:18px;background:#151e19}.status{color:#72df9b;text-transform:uppercase;letter-spacing:.12em;font-size:12px}code,pre{background:#0b100d;border-radius:8px}code{padding:2px 6px}pre{padding:16px;white-space:pre-wrap;color:#b9c8bf}ul{padding-left:20px}</style></head>
<body><main><div class="status">{{.Status}}</div><h1>{{.Title}}</h1><p>{{.Report}}</p><h2>Changed files</h2>{{if .ChangedFiles}}<ul>{{range .ChangedFiles}}<li><code>{{.}}</code></li>{{end}}</ul>{{else}}<p>No changed files yet.</p>{{end}}<h2>Verification</h2><pre>{{.TestOutput}}</pre></main></body></html>`))

func (app *App) PreviewHandler() http.Handler {
	return http.HandlerFunc(app.preview)
}

func (app *App) preview(w http.ResponseWriter, r *http.Request) {
	prefix := "/preview/"
	if !strings.HasPrefix(r.URL.Path, prefix) {
		app.store.RLock()
		active := app.store.tasks[app.store.workspaceTaskID]
		if active.PreviewStatus != "ready" {
			for id := range app.store.previews {
				if candidate := app.store.tasks[id]; candidate.PreviewStatus == "ready" {
					active = candidate
					break
				}
			}
		}
		app.store.RUnlock()
		if active.PreviewStatus != "ready" || active.PreviewInternalPort == 0 {
			http.NotFound(w, r)
			return
		}
		copyRequest := r.Clone(r.Context())
		copyURL := *r.URL
		copyURL.Path = prefix + active.ID + r.URL.Path
		copyRequest.URL = &copyURL
		r = copyRequest
	}
	parts := strings.SplitN(strings.TrimPrefix(r.URL.Path, prefix), "/", 2)
	id := parts[0]
	app.store.RLock()
	task, ok := app.store.tasks[id]
	app.store.RUnlock()
	if !ok {
		http.NotFound(w, r)
		return
	}

	if task.PreviewStatus == "ready" && task.PreviewInternalPort > 0 {
		target, _ := url.Parse(fmt.Sprintf("http://127.0.0.1:%d", task.PreviewInternalPort))
		proxy := httputil.NewSingleHostReverseProxy(target)
		originalDirector := proxy.Director
		pathPrefix := prefix + id
		proxy.Director = func(request *http.Request) {
			originalDirector(request)
			request.URL.Path = strings.TrimPrefix(request.URL.Path, pathPrefix)
			if request.URL.Path == "" {
				request.URL.Path = "/"
			}
		}
		proxy.ServeHTTP(w, r)
		return
	}
	http.Error(w, "Live preview is not running.", http.StatusServiceUnavailable)
}
