param([string]$BaseUrl="http://127.0.0.1:5202", [string]$Suffix="next")
Set-Location $PSScriptRoot/..
# Run sequentially; failed attempts remain in their own directories and never stop collection.
$ErrorActionPreference='Continue'
$env:BASE_URL=$BaseUrl
$env:RACES='2'
Remove-Item Env:P09C_TRACE -ErrorAction SilentlyContinue
Remove-Item Env:VIEW -ErrorAction SilentlyContinue
foreach ($width in @(1280,1920)) {
 foreach ($route in @('harbor','express')) {
  foreach ($equipment in @('stock','equipped')) {
   $caseName="native-$width-$route-$equipment-${Suffix}"
   $env:WIDTH=[string]$width
   $env:ROUTE=$route
   $env:BUILD=$equipment
   $env:EVIDENCE_DIR="director-kit/production/evidence/P09C/$caseName"
   Write-Output "BEGIN $caseName"
   node scripts/profile-p09c.mjs *> ".p09c-$caseName.log"
   Write-Output "END $caseName exit=$LASTEXITCODE"
  }
 }
}
