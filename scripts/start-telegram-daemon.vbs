Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Coding\pjtech-autonomous\video-engine"
WshShell.Run "cmd /c set PLAYWRIGHT_BROWSERS_PATH=0 && npx tsx src/telegram.ts >> D:\Coding\pjtech-autonomous\telegram-daemon.log 2>&1", 0, False