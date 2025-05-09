# Laapak Report System - Backend Installation Script
# This PowerShell script helps set up the Laravel backend for our project

Write-Host "Laapak Report System - Backend Setup" -ForegroundColor Green
Write-Host "--------------------------------------" -ForegroundColor Green

# Step 1: Check PHP Installation
Write-Host "[1/6] Checking PHP installation..." -ForegroundColor Cyan
try {
    $phpVersion = php -v
    if ($phpVersion -match "PHP ([0-9]+\.[0-9]+\.[0-9]+)") {
        Write-Host "PHP is installed: $($Matches[1])" -ForegroundColor Green
    } else {
        Write-Host "PHP is installed but version couldn't be determined" -ForegroundColor Yellow
    }
} catch {
    Write-Host "PHP is not installed or not in PATH. Please install PHP and run this script again." -ForegroundColor Red
    exit
}

# Step 2: Install Composer
Write-Host "[2/6] Installing Composer..." -ForegroundColor Cyan
$composerInstaller = "composer-setup.php"
$composerSetupUrl = "https://getcomposer.org/installer"

try {
    Invoke-WebRequest -Uri $composerSetupUrl -OutFile $composerInstaller
    php $composerInstaller
    Move-Item composer.phar composer.phar -Force
    Write-Host "Composer installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to install Composer: $_" -ForegroundColor Red
    exit
}

# Step 3: Create Laravel Project in 'backend' directory
Write-Host "[3/6] Creating Laravel project..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Force -Path "backend" | Out-Null
    Set-Location backend
    php ..\composer.phar create-project --prefer-dist laravel/laravel .
    Write-Host "Laravel project created successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to create Laravel project: $_" -ForegroundColor Red
    Set-Location ..
    exit
}

# Step 4: Configure Laravel .env file
Write-Host "[4/6] Configuring Laravel environment..." -ForegroundColor Cyan
try {
    $envContent = Get-Content .env
    $envContent = $envContent -replace "DB_DATABASE=laravel", "DB_DATABASE=laapak_reports"
    $envContent = $envContent -replace "DB_USERNAME=root", "DB_USERNAME=root"
    $envContent = $envContent -replace "DB_PASSWORD=", "DB_PASSWORD="
    $envContent = $envContent -replace "APP_NAME=Laravel", "APP_NAME=`"Laapak Report System`""
    Set-Content -Path .env -Value $envContent
    Write-Host "Environment configured successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to configure environment: $_" -ForegroundColor Red
}

# Step 5: Install additional packages
Write-Host "[5/6] Installing additional packages..." -ForegroundColor Cyan
try {
    php ..\composer.phar require barryvdh/laravel-dompdf
    php ..\composer.phar require simplesoftwareio/simple-qrcode
    Write-Host "Additional packages installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to install additional packages: $_" -ForegroundColor Red
}

# Step 6: Create basic structure
Write-Host "[6/6] Creating basic project structure..." -ForegroundColor Cyan
try {
    # Create Models directory and files
    New-Item -ItemType Directory -Force -Path "app/Models" | Out-Null
    
    # Create database migrations directory
    New-Item -ItemType Directory -Force -Path "database/migrations" | Out-Null
    
    # Create Controllers directory
    New-Item -ItemType Directory -Force -Path "app/Http/Controllers/Api" | Out-Null
    
    # Return to main directory
    Set-Location ..
    
    Write-Host "Project structure created successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to create project structure: $_" -ForegroundColor Red
    Set-Location ..
}

Write-Host "`nBackend setup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure your database (MySQL/MariaDB)" -ForegroundColor Yellow
Write-Host "2. Run migrations: php artisan migrate" -ForegroundColor Yellow
Write-Host "3. Seed initial data: php artisan db:seed" -ForegroundColor Yellow
Write-Host "4. Start development server: php artisan serve" -ForegroundColor Yellow
