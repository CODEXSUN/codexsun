param(
    [ValidateSet("restore", "build", "run", "publish", "package", "install", "uninstall")]
    [string]$Action = "build"
)

$ErrorActionPreference = "Stop"
$windowsRoot = Split-Path -Parent $PSScriptRoot
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $windowsRoot "..\..\.."))
$manifestPath = Join-Path $windowsRoot "src-tauri\Cargo.toml"
$temporaryRoot = Join-Path $repositoryRoot "dist\.tmp\desktop"
New-Item -ItemType Directory -Force -Path $temporaryRoot | Out-Null
$env:TEMP = $temporaryRoot
$env:TMP = $temporaryRoot
node.exe (Join-Path $repositoryRoot "tools/prepare-native-output.mjs") windows
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$env:CARGO_TARGET_DIR = Join-Path $repositoryRoot "dist\.cargo\windows"

function Invoke-Checked([scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

switch ($Action) {
    "restore" {
        Invoke-Checked { cargo fetch --manifest-path $manifestPath }
    }
    "build" {
        Invoke-Checked { npm.cmd run build -w @codexsun/windows }
        Invoke-Checked { cargo build --manifest-path $manifestPath --release }
    }
    "run" {
        Push-Location $windowsRoot
        try {
            Invoke-Checked { node.exe "..\..\..\node_modules\@tauri-apps\cli\tauri.js" dev }
        } finally {
            Pop-Location
        }
    }
    "publish" {
        Invoke-Checked { npm.cmd run build -w @codexsun/windows }
        Invoke-Checked { cargo build --manifest-path $manifestPath --release }
    }
    "package" {
        & (Join-Path $PSScriptRoot "package.ps1")
    }
    "install" {
        & (Join-Path $PSScriptRoot "install.ps1")
    }
    "uninstall" {
        & (Join-Path $PSScriptRoot "uninstall.ps1")
    }
}
