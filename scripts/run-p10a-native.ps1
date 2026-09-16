param([string]$BaseUrl="http://127.0.0.1:5204", [string]$Suffix="final-01")
Set-Location $PSScriptRoot/..
$ErrorActionPreference='Continue'
$env:BASE_URL=$BaseUrl
$env:RACES='2'
Remove-Item Env:P09C_TRACE -ErrorAction SilentlyContinue
Remove-Item Env:VIEW -ErrorAction SilentlyContinue
foreach ($width in @(1280,1920)) {
 foreach ($lighting in @('day','night')) {
  foreach ($equipment in @('stock','equipped')) {
   $caseName="native-$width-ridge-$lighting-$equipment-$Suffix"
   $env:WIDTH=[string]$width; $env:ROUTE='ridge'; $env:LIGHTING=$lighting; $env:BUILD=$equipment
   $env:EVIDENCE_DIR="director-kit/production/evidence/P10A/$caseName"
   Write-Output "BEGIN $caseName"
   node scripts/profile-p10a.mjs *> ".p10a-$caseName.log"
   Write-Output "END $caseName exit=$LASTEXITCODE"
  }
 }
}
$env:WIDTH='1920'; $env:BUILD='equipped'; $env:LIGHTING='night'; $env:VIEW='cockpit'
$env:EVIDENCE_DIR="director-kit/production/evidence/P10A/native-1920-ridge-night-cockpit-$Suffix"
node scripts/profile-p10a.mjs *> ".p10a-cockpit-$Suffix.log"
Write-Output "END cockpit exit=$LASTEXITCODE"
Remove-Item Env:VIEW -ErrorAction SilentlyContinue
foreach($route in @('harbor','express')) {
 $env:ROUTE=$route; $env:LIGHTING='day'; $env:EVIDENCE_DIR="director-kit/production/evidence/P10A/native-1920-$route-equipped-$Suffix"
 node scripts/profile-p10a.mjs *> ".p10a-$route-$Suffix.log"
 Write-Output "END $route exit=$LASTEXITCODE"
}
