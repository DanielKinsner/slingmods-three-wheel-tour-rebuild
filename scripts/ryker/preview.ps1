param([int]$Port=5198)
$ErrorActionPreference='Stop'
$repo=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $repo
try {
 if(!(Test-Path -LiteralPath 'node_modules/vite/bin/vite.js')){& npm.cmd ci --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw 'Dependency restore failed'}}
 Write-Output "Open http://127.0.0.1:$Port/?visual=ryker"
 & node node_modules/vite/bin/vite.js --host 127.0.0.1 --port $Port --strictPort
} finally {Pop-Location}
