const vscode = require("vscode");
function activate(context) {
  const provider = { getTreeItem: (item) => item, getChildren: () => ["Applications", "Devkits", "Registry status", "Runtime health", "Tests", "Migrations", "Agent actions"].map((label) => new vscode.TreeItem(label)) };
  context.subscriptions.push(vscode.window.registerTreeDataProvider("codexsun.zuno", provider));
}
function deactivate() {}
module.exports = { activate, deactivate };
