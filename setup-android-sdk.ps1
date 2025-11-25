# Simple Android SDK Setup and Build Script

Write-Host "Android SDK Setup for SuperSix MBBS Prep" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$sdkRoot = "C:\Android\sdk"
$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$cmdlineToolsZip = "$env:TEMP\commandlinetools.zip"

# Step 1: Create directory
Write-Host "[1/6] Creating SDK directory..."
New-Item -ItemType Directory -Path "$sdkRoot\cmdline-tools" -Force | Out-Null
Write-Host "Done" -ForegroundColor Green

# Step 2: Download
Write-Host "[2/6] Downloading Android SDK tools (~150MB)..."
Write-Host "Please wait, this may take several minutes..."
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $cmdlineToolsZip -UseBasicParsing
    Write-Host "Download complete" -ForegroundColor Green
} catch {
    Write-Host "Download failed. Please check your internet connection." -ForegroundColor Red
    exit 1
}

# Step 3: Extract
Write-Host "[3/6] Extracting files..."
Expand-Archive -Path $cmdlineToolsZip -DestinationPath "$sdkRoot\cmdline-tools" -Force
if (Test-Path "$sdkRoot\cmdline-tools\cmdline-tools") {
    Rename-Item "$sdkRoot\cmdline-tools\cmdline-tools" "latest"
}
Remove-Item $cmdlineToolsZip -Force
Write-Host "Done" -ForegroundColor Green

# Step 4: Set environment variables
Write-Host "[4/6] Setting environment variables..."
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkRoot, 'User')
$env:ANDROID_HOME = $sdkRoot
$env:PATH = "$env:PATH;$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools"
Write-Host "Done" -ForegroundColor Green

# Step 5: Install SDK packages
Write-Host "[5/6] Installing SDK packages (~500MB)..."
Write-Host "Accepting licenses and installing components..."
$sdkmanager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkmanager) {
    echo "y" | & $sdkmanager --licenses | Out-Null
    & $sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" | Out-Null
    Write-Host "Done" -ForegroundColor Green
} else {
    Write-Host "Error: sdkmanager not found" -ForegroundColor Red
    exit 1
}

# Step 6: Create local.properties
Write-Host "[6/6] Configuring project..."
$localProps = "sdk.dir=" + $sdkRoot.Replace('\', '\\')
Set-Content -Path "android\local.properties" -Value $localProps
Write-Host "Done" -ForegroundColor Green

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "SDK installed at: $sdkRoot" -ForegroundColor Cyan
Write-Host ""
Write-Host "Building APK now..." -ForegroundColor Yellow
Write-Host ""

# Build APK
Set-Location android
& .\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! APK Built Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor Cyan
    Write-Host "android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Build failed. Check errors above." -ForegroundColor Red
}
