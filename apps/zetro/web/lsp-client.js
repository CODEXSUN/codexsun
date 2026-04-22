const LSP_VERSION = "2.0";

export class ZetroLspClient {
  constructor({ root = "workspace", onDiagnostics, onStatus } = {}) {
    this.root = root;
    this.onDiagnostics = onDiagnostics;
    this.onStatus = onStatus;
    this.socket = null;
    this.requestId = 0;
    this.pending = new Map();
    this.isReady = false;
    this.openDocuments = new Map();
  }

  connect() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${location.host}/lsp?root=${encodeURIComponent(this.root)}`;
    this.socket = new WebSocket(url);
    this.reportStatus("connecting");

    this.socket.addEventListener("open", async () => {
      this.reportStatus("connected");
      try {
        await this.request("initialize", {
          processId: null,
          clientInfo: { name: "Zetro IDE", version: "1.0.207" },
          rootUri: null,
          capabilities: {
            textDocument: {
              synchronization: {
                didSave: true,
                willSave: false,
                willSaveWaitUntil: false,
              },
              publishDiagnostics: {
                relatedInformation: true,
              },
            },
            workspace: {
              workspaceFolders: false,
            },
          },
        });
        this.notify("initialized", {});
        this.isReady = true;
        this.reportStatus("ready");
        this.reopenDocuments();
      } catch (error) {
        console.warn("LSP initialize failed", error);
        this.reportStatus("error");
      }
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleMessage(payload);
      } catch (error) {
        console.warn("Failed to parse LSP websocket payload", error);
      }
    });

    this.socket.addEventListener("close", () => {
      this.isReady = false;
      this.reportStatus("closed");
    });

    this.socket.addEventListener("error", (error) => {
      console.warn("LSP socket error", error);
      this.reportStatus("error");
    });
  }

  reportStatus(status) {
    if (typeof this.onStatus === "function") {
      this.onStatus(status);
    }
  }

  send(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("LSP socket is not open");
    }
    this.socket.send(JSON.stringify(payload));
  }

  request(method, params) {
    const id = ++this.requestId;
    const payload = { jsonrpc: LSP_VERSION, id, method, params };
    this.send(payload);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method, params) {
    this.send({ jsonrpc: LSP_VERSION, method, params });
  }

  handleMessage(message) {
    if (message.id != null) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(message.error);
        return;
      }
      pending.resolve(message.result);
      return;
    }

    if (message.method === "textDocument/publishDiagnostics") {
      this.onDiagnostics?.(message.params);
      return;
    }

    if (message.method === "window/logMessage") {
      console.info("[lsp]", message.params);
      return;
    }

    if (message.method === "window/showMessage") {
      console.warn("[lsp]", message.params);
    }
  }

  reopenDocuments() {
    if (!this.isReady) {
      return;
    }

    for (const document of this.openDocuments.values()) {
      this.notify("textDocument/didOpen", {
        textDocument: {
          uri: document.uri,
          languageId: document.languageId,
          version: document.version,
          text: document.text,
        },
      });
    }
  }

  openDocument(document) {
    this.openDocuments.set(document.uri, document);
    if (!this.isReady) {
      return;
    }
    this.notify("textDocument/didOpen", {
      textDocument: {
        uri: document.uri,
        languageId: document.languageId,
        version: document.version,
        text: document.text,
      },
    });
  }

  changeDocument({ uri, version, text }) {
    const current = this.openDocuments.get(uri);
    if (current) {
      current.version = version;
      current.text = text;
    }
    if (!this.isReady) {
      return;
    }
    this.notify("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  saveDocument(uri) {
    const current = this.openDocuments.get(uri);
    if (!current || !this.isReady) {
      return;
    }
    this.notify("textDocument/didSave", {
      textDocument: { uri },
      text: current.text,
    });
  }

  closeDocument(uri) {
    this.openDocuments.delete(uri);
    if (!this.isReady) {
      return;
    }
    this.notify("textDocument/didClose", {
      textDocument: { uri },
    });
  }
}
