param([string]$Script = 'scripts/calibration.py')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$portableExe = Join-Path $projectRoot '.tools\blender-4.5.2-windows-x64\blender.exe'
if (!(Test-Path -LiteralPath $portableExe)) {
    throw 'Portable Blender missing. Install Blender locally or download the documented Blender 4.5.2 portable ZIP into .tools; see G0/environment.json. No project assets were changed.'
}
Push-Location $projectRoot
try { & $portableExe --background --factory-startup --python $Script; if ($LASTEXITCODE -ne 0) { throw "Blender failed: $LASTEXITCODE" } }
finally { Pop-Location }
