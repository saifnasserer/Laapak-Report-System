@echo off
echo Checking Laapak Report System status...
echo.

:: Change to the project directory
cd /d "d:\Laapak Report System"

:: Check if the server is already running on port 8000
netstat -ano | find "LISTENING" | find "8000" > nul
if %errorlevel% equ 0 (
    echo Laapak Report System is already running at http://localhost:8000
    echo Opening the browser...
    start http://localhost:8000
) else (
    echo Starting Laapak Report System Server...
    echo Server will be available at: http://localhost:8000
    echo Press Ctrl+C to stop the server when finished
    echo.
    
    :: Start the browser and then the server
    start http://localhost:8000
    php -S localhost:8000
)
