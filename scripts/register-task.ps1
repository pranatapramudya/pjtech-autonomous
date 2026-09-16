# Register Task Scheduler for PJTech Autonomous Boot
$taskName = "PJTech-Autonomous-Boot"
$scriptPath = "D:\Coding\pjtech-autonomous\scripts\boot-launcher.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
Write-Host "Task $taskName successfully registered (24/7 Unlimited Execution)!"
