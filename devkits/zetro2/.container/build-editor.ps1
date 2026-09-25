# Builds ZVcode in Docker and exports the packaged server to root dist/zetro2/editor.
# Usage (from anywhere inside the repository):
#   powershell -File devkits/zetro2/.container/build-editor.ps1           # export artifacts
#   powershell -File devkits/zetro2/.container/build-editor.ps1 -Check    # lint Dockerfile only
param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside the CODEXSUN repository (git rev-parse --show-toplevel failed).'
}

$dockerfile = Join-Path $repoRoot 'devkits/zetro2/.container/Editor.Dockerfile'
$context = Join-Path $repoRoot 'devkits/zetro2/zvcode'
$outDir = Join-Path $repoRoot 'dist/zetro2/editor'

if ($Check) {
    docker build --check -f $dockerfile $context
    exit $LASTEXITCODE
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
docker build -f $dockerfile --target export --output "type=local,dest=$outDir" $context
exit $LASTEXITCODE
