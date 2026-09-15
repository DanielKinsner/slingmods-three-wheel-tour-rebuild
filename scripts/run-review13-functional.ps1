param([string]$EvidenceRoot = 'director-kit/production/evidence/P06C')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$checks = @(
    @{ Name = 'fresh'; Script = 'verify-fresh-chapter.mjs' },
    @{ Name = 'lifecycle'; Script = 'verify-review12-lifecycle.mjs' },
    @{ Name = 'transitions'; Script = 'verify-review12-final-transitions.mjs' },
    @{ Name = 'controller'; Script = 'verify-crew-controller.mjs' },
    @{ Name = 'audio'; Script = 'verify-crew-audio.mjs' },
    @{ Name = 'crew-ui'; Script = 'verify-crew-ui-p06.mjs' },
    @{ Name = 'bay'; Script = 'capture-review12-bay.mjs' },
    @{ Name = 'interface'; Script = 'review-p06-interface.mjs' },
    @{ Name = 'solo-ui'; Script = 'verify-harbor-ui.mjs' }
)
foreach ($check in $checks) {
    if (Test-Path -LiteralPath "$EvidenceRoot/$($check.Name)-final") { throw "Evidence exists: $($check.Name)" }
}
$failures = @()
$env:FLOW_CAPTURE = '1'; $env:VERIFY_BUILD = '1'
foreach ($check in $checks) {
    $env:EVIDENCE_DIR = "$EvidenceRoot/$($check.Name)-final"
    $env:UI_EVIDENCE_DIR = $env:EVIDENCE_DIR
    $env:HARBOR_UI_DIR = $env:EVIDENCE_DIR
    node "scripts/$($check.Script)" *> "$EvidenceRoot/setup/functional-$($check.Name).log"
    if ($LASTEXITCODE -ne 0) { $failures += $check.Name }
}
if ($failures.Count) { throw "Failed checks retained: $($failures -join ', ')" }
