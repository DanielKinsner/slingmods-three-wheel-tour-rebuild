$ErrorActionPreference='Stop'
$root=(Resolve-Path '.').Path
$evidence=Join-Path $root 'director-kit/production/evidence/P07A'
$powershell=(Get-Command pwsh -ErrorAction SilentlyContinue).Source
if(!$powershell){$powershell=(Get-Command powershell).Source}
$env:BASE_URL='http://127.0.0.1:5188';$env:RECORD='0';$env:SEED='11';$env:DIAGNOSTIC='0';$env:OLD_INSPECT='0'
$cases=@(
 @{name='verified-scored-equipped1080-repeat';width=1920;equipped=1;races=2;warm=2},
 @{name='verified-scored-stock720';width=1280;equipped=0;races=1;warm=0},
 @{name='verified-scored-equipped720';width=1280;equipped=1;races=1;warm=0},
 @{name='verified-scored-stock1080';width=1920;equipped=0;races=1;warm=0},
 @{name='verified-scored-equipped1080';width=1920;equipped=1;races=1;warm=0},
 @{name='day-scored-equipped1080';width=1920;equipped=1;races=1;warm=0;day=$true}
)
foreach($case in $cases){
 $name=$case.name;$hostOutput=Join-Path $evidence ($name+'-host.jsonl');$stopFile=Join-Path $evidence ($name+'-collector.stop')
 if(Test-Path -LiteralPath (Join-Path $evidence $name)){throw 'Existing final evidence must be retained'}
 $collectorArgs=@('-NoProfile','-File',('"'+(Join-Path $root 'scripts/observe-review14-host.ps1')+'"'),'-Output',('"'+$hostOutput+'"'),'-Seconds','900','-StopFile',('"'+$stopFile+'"'))
 $collector=Start-Process -FilePath $powershell -ArgumentList $collectorArgs -WindowStyle Hidden -PassThru
 try{
  $env:EVIDENCE_DIR=Join-Path $evidence $name;$env:WIDTH=[string]$case.width;$env:EQUIPPED=[string]$case.equipped;$env:RACES=[string]$case.races;$env:WARM_TRANSITIONS=[string]$case.warm;$env:LAPS='1'
  $script=if($case.day){'scripts/profile-review14-day.mjs'}else{'scripts/profile-review14.mjs'}
  node $script *> (Join-Path $evidence ('setup/'+$name+'.log'))
  if($LASTEXITCODE -ne 0){throw "Functional run failed: $name; complete available output retained"}
  Write-Output "COMPLETE $name"
 }finally{Set-Content -LiteralPath $stopFile -Value 'Collector may stop; own benchmark completed.';$collector.WaitForExit()}
}
python scripts/summarize-review14.py
if($LASTEXITCODE -ne 0){throw 'Scorer failed'}
