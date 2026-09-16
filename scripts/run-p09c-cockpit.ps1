param([string]$BaseUrl='http://127.0.0.1:5202',[string]$Suffix='final-01')
Set-Location $PSScriptRoot/..
$env:BASE_URL=$BaseUrl
$env:RACES='1'
$env:VIEW='cockpit'
Remove-Item Env:P09C_TRACE -ErrorAction SilentlyContinue
foreach($case in @(@('1280','harbor','stock'),@('1920','express','equipped'))){
 $env:WIDTH=$case[0]
 $env:ROUTE=$case[1]
 $env:BUILD=$case[2]
 $name='native-extra-'+($case -join '-')+'-cockpit-'+$Suffix
 $env:EVIDENCE_DIR='director-kit/production/evidence/P09C/'+$name
 Write-Output "BEGIN $name"
 node scripts/profile-p09c.mjs *> ".p09c-$name.log"
 Write-Output "END $name exit=$LASTEXITCODE"
}
