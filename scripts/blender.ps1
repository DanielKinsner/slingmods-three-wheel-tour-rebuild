param([string]$Script = 'scripts/calibration.py', [string]$BlenderExe = $env:BLENDER_EXE)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$portableExe = Join-Path $projectRoot '.tools\blender-4.5.2-windows-x64\blender.exe'
if (!$BlenderExe) {
    $located = Get-Command blender -ErrorAction SilentlyContinue
    if ($located) { $BlenderExe = $located.Source }
    elseif (Test-Path -LiteralPath $portableExe) { $BlenderExe = $portableExe }
}
if (!$BlenderExe -or !(Test-Path -LiteralPath $BlenderExe)) {
    throw 'Blender missing. Supply -BlenderExe, set BLENDER_EXE, install on PATH, or use the optional .tools portable folder. See HANDOFF.md. No project assets were changed.'
}
Push-Location $projectRoot
try { & $BlenderExe --background --factory-startup --python $Script; if ($LASTEXITCODE -ne 0) { throw "Blender failed: $LASTEXITCODE" } }
finally { Pop-Location }
