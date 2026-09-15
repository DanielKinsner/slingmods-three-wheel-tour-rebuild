param([string]$EvidenceRoot = 'director-kit/production/evidence/P06C')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$configurations = @(
    @{ Name = 'stock1080'; Width = 1920; Equipped = 0; Races = 1; Warm = 0 },
    @{ Name = 'stock720'; Width = 1280; Equipped = 0; Races = 1; Warm = 0 },
    @{ Name = 'equipped1080'; Width = 1920; Equipped = 1; Races = 1; Warm = 0 },
    @{ Name = 'equipped720'; Width = 1280; Equipped = 1; Races = 1; Warm = 0 },
    @{ Name = 'equipped1080-repeat'; Width = 1920; Equipped = 1; Races = 2; Warm = 2 }
)
# Fresh complete runs only. Never overwrite or omit a failed first attempt.
foreach ($configuration in $configurations) {
    if (Test-Path -LiteralPath "$EvidenceRoot/verified-scored-$($configuration.Name)") {
        throw "Evidence already exists: $($configuration.Name). Supply a fresh EvidenceRoot."
    }
}
if (Test-Path -LiteralPath "$EvidenceRoot/day-scored-equipped1080") { throw 'Day evidence already exists.' }
$failures = @()
foreach ($configuration in $configurations) {
    $env:EVIDENCE_DIR = "$EvidenceRoot/verified-scored-$($configuration.Name)"
    $env:WIDTH = [string]$configuration.Width
    $env:EQUIPPED = [string]$configuration.Equipped
    $env:RACES = [string]$configuration.Races
    $env:WARM_TRANSITIONS = [string]$configuration.Warm
    $env:RECORD = '0'
    $env:SEED = '11'
    node scripts/profile-review12.mjs *> "$EvidenceRoot/setup/native-$($configuration.Name).log"
    if ($LASTEXITCODE -ne 0) { $failures += $configuration.Name }
}
$env:EVIDENCE_DIR = "$EvidenceRoot/day-scored-equipped1080"
$env:WIDTH = '1920'; $env:EQUIPPED = '1'; $env:LAPS = '1'
$env:RECORD = '0'; $env:DIAGNOSTIC = '0'; $env:OLD_INSPECT = '0'
node scripts/profile-review13-day.mjs *> "$EvidenceRoot/setup/native-day-equipped1080.log"
if ($LASTEXITCODE -ne 0) { $failures += 'day-equipped1080' }
if ($failures.Count) { throw "Raw failures retained: $($failures -join ', ')" }
