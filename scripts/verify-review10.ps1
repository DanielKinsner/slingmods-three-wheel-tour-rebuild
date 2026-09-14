$ErrorActionPreference='Stop'
if((Get-Location).Path -ne 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'){throw 'Wrong project root'}
& npm test *> 'director-kit/production/evidence/P05/tests-verified.log'
if($LASTEXITCODE -ne 0){throw 'Tests failed'}
& node scripts/build-review10.mjs *> 'director-kit/production/evidence/P05/build-verified.log'
if($LASTEXITCODE -ne 0){throw 'Build failed'}
Copy-Item -LiteralPath 'dist/review-build.json' -Destination 'director-kit/production/evidence/P05/build-inputs-verified.json'
& npx tsx scripts/parity-p05.ts *> 'director-kit/production/evidence/P05/parity-verified.log'
if($LASTEXITCODE -ne 0){throw 'Parity failed'}
& npx tsx scripts/check-shared-support.ts
if($LASTEXITCODE -ne 0){throw 'Support failed'}
$env:EVIDENCE_DIR='director-kit/production/evidence/P05/fresh-verified';$env:FLOW_CAPTURE='1'
& node scripts/verify-fresh-chapter.mjs
if($LASTEXITCODE -ne 0){throw 'Fresh flow failed'}
Remove-Item Env:FLOW_CAPTURE
foreach($kind in @('ui','controller','audio')){
 $env:EVIDENCE_DIR='director-kit/production/evidence/P05/'+$kind+'-verified'
 & node ('scripts/verify-crew-'+$kind+'.mjs')
 if($LASTEXITCODE -ne 0){throw ('Failed '+$kind)}
}
$env:HARBOR_UI_DIR='director-kit/production/evidence/P05/solo-ui-verified';$env:VERIFY_BUILD='1'
& node scripts/verify-harbor-ui.mjs
if($LASTEXITCODE -ne 0){throw 'Solo UI failed'}
& pwsh -NoProfile -File scripts/run-review10-matrix.ps1
if($LASTEXITCODE -ne 0){throw 'Matrix failed'}
$env:EVIDENCE_DIR='director-kit/production/evidence/P05/video-verified';$env:WIDTH='1280';$env:EQUIPPED='1';$env:RACES='1';$env:SEED='11';$env:RECORD='1'
& node scripts/profile-review10.mjs *> 'director-kit/production/evidence/P05/video-verified.log'
if($LASTEXITCODE -ne 0){throw 'Video failed'}
