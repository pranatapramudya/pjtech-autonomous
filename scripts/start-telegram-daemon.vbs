Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Coding\one-sales-man"
WshShell.Run "cmd /c npx tsx src/whatsapp/daemon.ts >> D:\Coding\pjtech-autonomous\whatsapp-daemon.log 2>&1", 0, False
WshShell.CurrentDirectory = "D:\Coding\pjtech-autonomous\video-engine"
WshShell.Run "cmd /c npx tsx src/telegram.ts >> D:\Coding\pjtech-autonomous\telegram-daemon.log 2>&1", 0, False