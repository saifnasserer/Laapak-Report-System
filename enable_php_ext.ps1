# Script to enable required PHP extensions for Laravel/Composer
Write-Host "Enabling required PHP extensions..." -ForegroundColor Green

# First check if php.ini exists, if not, create from php.ini-development
if (!(Test-Path "C:\php\php.ini")) {
    if (Test-Path "C:\php\php.ini-development") {
        Copy-Item "C:\php\php.ini-development" "C:\php\php.ini"
        Write-Host "Created php.ini from php.ini-development" -ForegroundColor Cyan
    } else {
        Write-Host "Error: Could not find php.ini or php.ini-development" -ForegroundColor Red
        exit 1
    }
}

# Make a backup of php.ini
Copy-Item "C:\php\php.ini" "C:\php\php.ini.backup"
Write-Host "Backed up php.ini to php.ini.backup" -ForegroundColor Cyan

# Enable required extensions by uncommenting them
$extensions = @('zip', 'openssl', 'curl', 'fileinfo', 'mbstring', 'pdo_mysql')
$phpIniContent = Get-Content "C:\php\php.ini"

foreach ($ext in $extensions) {
    $phpIniContent = $phpIniContent -replace ";extension=$ext", "extension=$ext"
    Write-Host "Enabled $ext extension" -ForegroundColor Yellow
}

# Save the updated php.ini
Set-Content -Path "C:\php\php.ini" -Value $phpIniContent
Write-Host "Updated php.ini with enabled extensions" -ForegroundColor Green

# Test if PHP and required extensions are working
php -m | findstr zip
if ($LASTEXITCODE -eq 0) {
    Write-Host "ZIP extension is now enabled!" -ForegroundColor Green
} else {
    Write-Host "Warning: ZIP extension may not be working properly" -ForegroundColor Red
}

php -m | findstr openssl
if ($LASTEXITCODE -eq 0) {
    Write-Host "OpenSSL extension is now enabled!" -ForegroundColor Green
} else {
    Write-Host "Warning: OpenSSL extension may not be working properly" -ForegroundColor Red
}

# Continue with Laravel installation
Write-Host "`nDo you want to continue with Laravel installation? (yes/no)"
$continue = Read-Host

if ($continue -eq "yes") {
    Set-Location "d:\Laapak Report System"
    
    # Check if there was a failed installation attempt and clean up
    if (Test-Path "backend") {
        Write-Host "Removing incomplete backend directory..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "backend"
    }
    
    # Create Laravel project with composer.phar
    Write-Host "Creating Laravel project..." -ForegroundColor Green
    php composer.phar create-project --prefer-dist laravel/laravel backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Laravel project created successfully!" -ForegroundColor Green
        # Run the setup script to complete the configuration
        Write-Host "Running Laravel setup script..." -ForegroundColor Cyan
        powershell -ExecutionPolicy Bypass -File download_composer_setup_laravel.ps1
    } else {
        Write-Host "Failed to create Laravel project. Check PHP extensions." -ForegroundColor Red
    }
}
