$ErrorActionPreference='Stop'
if((Get-Location).Path -ne 'C:\Users\SM - Dan\Documents\GitHub\slingmods-three-wheel-tour-rebuild'){throw 'Wrong project root'}
$cases=@(
 @{Name='scored-equipped1080';Width='1920';Equipped='1';Races='2';Seed='11'},
 @{Name='scored-stock1080';Width='1920';Equipped='0';Races='1';Seed='97'},
 @{Name='scored-equipped720';Width='1280';Equipped='1';Races='1';Seed='11'},
 @{Name='scored-stock720';Width='1280';Equipped='0';Races='1';Seed='97'},
 @{Name='scored-equipped1080-repeat';Width='1920';Equipped='1';Races='2';Seed='11'}
)
foreach($case in $cases){
 $env:EVIDENCE_DIR='director-kit/production/evidence/P05/'+$case.Name
 $env:WIDTH=$case.Width;$env:EQUIPPED=$case.Equipped;$env:RACES=$case.Races;$env:SEED=$case.Seed;$env:RECORD='0'
 & node scripts/profile-review10.mjs | Tee-Object -FilePath ('director-kit/production/evidence/P05/'+$case.Name+'.log')
 if($LASTEXITCODE -ne 0){throw ('Failed '+$case.Name)}
}
