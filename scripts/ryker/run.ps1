param(
 [Parameter(Mandatory=$true)][string]$Archive,
 [Parameter(Mandatory=$true)][string]$Workspace,
 [string]$BlenderExe=$env:BLENDER_EXE,
 [string]$UnrarExe,
 [switch]$SkipRenders
)
$ErrorActionPreference='Stop'
if($SkipRenders){$env:RYKER_SKIP_RENDERS='1'}else{Remove-Item Env:RYKER_SKIP_RENDERS -ErrorAction SilentlyContinue}
$repo=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Workspace=[IO.Path]::GetFullPath($Workspace)
if($Workspace.StartsWith((Join-Path $repo 'public'),[StringComparison]::OrdinalIgnoreCase)){throw 'Source/editable workspace must be outside public.'}
if(!$BlenderExe){$c=Get-Command blender -ErrorAction SilentlyContinue;if($c){$BlenderExe=$c.Source}}
if(!$BlenderExe){
 $parent=Split-Path $repo -Parent
 $candidates=@((Join-Path $repo '.tools/blender-4.5.2-windows-x64/blender.exe'),(Join-Path $parent 'slingmods-three-wheel-tour-rebuild/.tools/blender-4.5.2-windows-x64/blender.exe'),(Join-Path $parent 'slingmods-three-wheel-tour/work/blender-runtime/blender-4.5.3-windows-x64/blender.exe'))
 $BlenderExe=$candidates|Where-Object{Test-Path -LiteralPath $_}|Select-Object -First 1
}
if(!$BlenderExe -or !(Test-Path -LiteralPath $BlenderExe)){throw 'Blender not found. Supply -BlenderExe or BLENDER_EXE.'}
if(!$UnrarExe){$UnrarExe=Join-Path $env:ProgramFiles 'WinRAR/UnRAR.exe'}
if(!(Test-Path -LiteralPath $UnrarExe)){throw 'UnRAR not found. Supply -UnrarExe.'}
$source=Join-Path $Workspace 'source';$work=Join-Path $Workspace 'work';$runtime=Join-Path $repo 'public/assets/ryker'
New-Item -ItemType Directory -Force $source,$work,$runtime|Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Archive));$entry=$zip.GetEntry('Blender 2.9 .rar');if(!$entry){$zip.Dispose();throw 'Expected purchased Blender RAR missing.'}
$rar=Join-Path $source 'Blender 2.9 .rar'
try{if(!(Test-Path -LiteralPath $rar)){[IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$rar,$false)}else{$stream=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create();try{$expected=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','');if((Get-FileHash -LiteralPath $rar -Algorithm SHA256).Hash -ne $expected){throw 'Existing source differs; refusing overwrite.'}}finally{$stream.Dispose();$sha.Dispose()}}}finally{$zip.Dispose()}
$blend=Join-Path $source 'Blender 2.9 .blend'
if(!(Test-Path -LiteralPath $blend)){& $UnrarExe x -o- $rar ($source+[IO.Path]::DirectorySeparatorChar);if($LASTEXITCODE -ne 0){throw 'Source extraction failed.'}}
$receipt=[ordered]@{blender=$BlenderExe;version=(& $BlenderExe --version|Select-Object -First 1);archive=(Resolve-Path -LiteralPath $Archive).Path;archiveSha256=(Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash;sourceSha256=(Get-FileHash -LiteralPath $blend -Algorithm SHA256).Hash;rarSha256=(Get-FileHash -LiteralPath $rar -Algorithm SHA256).Hash;workspace=$Workspace;runtime=$runtime;commands=@()}
$previous=Join-Path $work 'workflow.json'
if(Test-Path -LiteralPath $previous){$prior=Get-Content -Raw -LiteralPath $previous|ConvertFrom-Json;if($prior.sourceSha256 -ne $receipt.sourceSha256){throw 'Preserved source hash changed; refusing conversion.'}}
(Get-Item -LiteralPath $blend).IsReadOnly=$true
function Run-Blender([string]$Name,[string]$InputFile,[string]$Script,[string[]]$ScriptArgs){
 $arguments=@('--background','--factory-startup','--disable-autoexec','--python-exit-code','1');if($InputFile){$arguments+=$InputFile};$arguments+=@('--python',(Join-Path $PSScriptRoot $Script),'--');$arguments+=$ScriptArgs
 $receipt.commands+=@{name=$Name;executable=$BlenderExe;arguments=$arguments;log=(Join-Path $work ($Name+'.log'))}
 & $BlenderExe @arguments *> (Join-Path $work ($Name+'.log'));if($LASTEXITCODE -ne 0){throw "Blender stage failed: $Name"}
 $receipt|ConvertTo-Json -Depth 8|Set-Content -Encoding utf8 (Join-Path $work 'workflow.json')
}
Run-Blender 'inspection' $blend 'inspect_source.py' @($work)
Run-Blender 'baseline' $blend 'baseline.py' @($work)
Run-Blender 'components' (Join-Path $work 'source-normalized.blend') 'components.py' @($work)
Run-Blender 'conversion' (Join-Path $work 'source-normalized.blend') 'convert.py' @($work,$runtime)
Run-Blender 'validation' '' 'validate.py' @($runtime,$work)
if((Get-FileHash -LiteralPath $blend -Algorithm SHA256).Hash -ne $receipt.sourceSha256){throw 'Source hash changed.'}
Write-Output "Ryker complete: $runtime ; editable master and renders: $work"
