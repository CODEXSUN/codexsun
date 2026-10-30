$ErrorActionPreference = "Stop"

Get-Process -Name "codexsun-windows" -ErrorAction SilentlyContinue | Stop-Process -Force
$uninstallEntry = Get-ItemProperty `
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*", `
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" `
    -ErrorAction SilentlyContinue |
    Where-Object DisplayName -EQ "CODEXSUN" |
    Select-Object -First 1

if (-not $uninstallEntry) {
    Write-Host "CODEXSUN Tauri is not installed for the current Windows user."
    exit 0
}

$uninstallCommand = $uninstallEntry.QuietUninstallString
if (-not $uninstallCommand) {
    $uninstallCommand = $uninstallEntry.UninstallString
}
if ($uninstallCommand -notmatch '^"?([^"].*?\.exe)"?\s*(.*)$') {
    throw "The registered CODEXSUN uninstaller is invalid."
}

$process = Start-Process -FilePath $Matches[1] -ArgumentList (($Matches[2] + " /S").Trim()) -PassThru -Wait
if ($process.ExitCode -ne 0) {
    throw "The CODEXSUN uninstaller exited with code $($process.ExitCode)."
}
Write-Host "CODEXSUN was uninstalled. Local workspace data was preserved."
