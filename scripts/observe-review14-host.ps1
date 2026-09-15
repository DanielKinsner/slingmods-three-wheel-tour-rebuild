param([Parameter(Mandatory=$true)][string]$Output,[int]$Seconds=30,[int]$IntervalMs=2000,[string]$StopFile="")
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;using System.Runtime.InteropServices;
public static class P07AHostTimes { [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetSystemTimes(out long idle,out long kernel,out long user); }
'@
$target=[IO.Path]::GetFullPath($Output)
if(Test-Path -LiteralPath $target){throw "Preserve existing observation: $target"}
$prior=@{};$priorIdle=0L;$priorKernel=0L;$priorUser=0L
[void][P07AHostTimes]::GetSystemTimes([ref]$priorIdle,[ref]$priorKernel,[ref]$priorUser)
$clock=[Diagnostics.Stopwatch]::StartNew();$priorWall=0.0;$cores=[Environment]::ProcessorCount
while($clock.Elapsed.TotalSeconds -lt $Seconds -and (!$StopFile -or !(Test-Path -LiteralPath $StopFile))){
 $sampleStart=$clock.Elapsed.TotalSeconds;$utc=[DateTime]::UtcNow.ToString('o');$current=@{};$groups=@{}
 foreach($p in Get-Process -ErrorAction SilentlyContinue){try{$cpu=$p.TotalProcessorTime.TotalSeconds;$name=$p.ProcessName;$idKey=[string]$p.Id;$current[$idKey]=@{cpu=$cpu;name=$name};if($prior.ContainsKey($idKey) -and $prior[$idKey].name -eq $name){$delta=[Math]::Max(0.0,([double]$cpu-[double]$prior[$idKey].cpu));if(!$groups.ContainsKey($name)){$groups[$name]=0.0};$groups[$name]+=$delta}}catch{}}
 $idle=0L;$kernel=0L;$user=0L;[void][P07AHostTimes]::GetSystemTimes([ref]$idle,[ref]$kernel,[ref]$user)
 $total=($kernel-$priorKernel)+($user-$priorUser);$global=if($total -gt 0){100*(1-($idle-$priorIdle)/$total)}else{0};$elapsed=$sampleStart-$priorWall
 $ranked=@($groups.GetEnumerator()|Sort-Object Value -Descending|ForEach-Object{@{name=$_.Key;cpuSeconds=$_.Value;hostPercent=if($elapsed -gt 0){100*$_.Value/$elapsed/$cores}else{0}}})
 $row=@{utc=$utc;elapsedSeconds=$sampleStart;intervalSeconds=$elapsed;globalCPUPercent=$global;logicalProcessors=$cores;processes=$ranked;collectionMs=1000*($clock.Elapsed.TotalSeconds-$sampleStart);method='2s nominal sample; process-name aggregates only, no command lines or paths. Process CPU deltas are divided by interval and logical processor count; global uses GetSystemTimes. First sample primes identities.'}
 $row|ConvertTo-Json -Depth 6 -Compress|Add-Content -LiteralPath $target -Encoding utf8
 $prior=$current;$priorIdle=$idle;$priorKernel=$kernel;$priorUser=$user;$priorWall=$sampleStart
 $remaining=$IntervalMs-1000*($clock.Elapsed.TotalSeconds-$sampleStart);if($remaining -gt 0){Start-Sleep -Milliseconds ([int]$remaining)}
}
