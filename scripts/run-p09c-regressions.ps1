param([string]$BaseUrl='http://127.0.0.1:5202',[string]$Suffix='final-01')
Set-Location $PSScriptRoot/..
$env:BASE_URL=$BaseUrl
$cases=@(
 @('profile-entry','scripts/p09c-profile-entry.mjs'),
 @('signature-integration','scripts/p09b-integration.mjs'),
 @('preparation','scripts/p09c-preparation-validation.mjs'),
 @('career-loop','scripts/p09c-career-loop.mjs'),
 @('ui','scripts/p09b-ui-validation.mjs'),
 @('finish-wait','scripts/p09c-finish-wait-resume.mjs'),
 @('audio','scripts/verify-p09c-audio.mjs')
)
foreach($item in $cases){
 $name=$item[0]+'-'+$Suffix
 $env:EVIDENCE_DIR='director-kit/production/evidence/P09C/'+$name
$env:BASE_URL=if($item[0] -eq 'audio'){'http://127.0.0.1:5201'}else{$BaseUrl}
 Write-Output "BEGIN $name"
 node $item[1] *> ".p09c-$name.log"
 Write-Output "END $name exit=$LASTEXITCODE"
}
