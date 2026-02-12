# Install yt-dlp into backend\bin for YouTube URL support
# Run from project root or from anywhere (script finds project root)

$ErrorActionPreference = "Stop"

# Project root = folder where this script lives
$ProjectRoot = $PSScriptRoot
$BinDir    = Join-Path $ProjectRoot "backend\bin"
$TargetExe = Join-Path $BinDir "yt-dlp.exe"

Write-Host "yt-dlp installer for Video Summarizer" -ForegroundColor Cyan
Write-Host "Target: $TargetExe" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path (Join-Path $ProjectRoot "backend"))) {
    Write-Host "ERROR: backend folder not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
    Write-Host "Created: $BinDir" -ForegroundColor Green
}

# Try direct latest-release download first
$DirectUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$Success = $false

try {
    Write-Host "Downloading yt-dlp from GitHub (latest)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $DirectUrl -OutFile $TargetExe -UseBasicParsing
    $Success = $true
} catch {
    Write-Host "Direct download failed, trying GitHub API..." -ForegroundColor Yellow
    try {
        $Latest = Invoke-RestMethod -Uri "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest" -UseBasicParsing
        $ExeAsset = $Latest.assets | Where-Object { $_.name -eq "yt-dlp.exe" } | Select-Object -First 1
        if (-not $ExeAsset) {
            $ExeAsset = $Latest.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1
        }
        if ($ExeAsset) {
            Invoke-WebRequest -Uri $ExeAsset.browser_download_url -OutFile $TargetExe -UseBasicParsing
            $Success = $true
        }
    } catch {
        Write-Host "API fallback failed: $_" -ForegroundColor Red
    }
}

if ($Success -and (Test-Path $TargetExe)) {
    Write-Host ""
    Write-Host "Done. yt-dlp installed at:" -ForegroundColor Green
    Write-Host "  $TargetExe" -ForegroundColor White
    Write-Host ""
    Write-Host "Restart the backend and try a YouTube URL." -ForegroundColor Cyan
    exit 0
} else {
    Write-Host ""
    Write-Host "Download failed. Install manually:" -ForegroundColor Red
    Write-Host "  1. Open https://github.com/yt-dlp/yt-dlp/releases" -ForegroundColor Gray
    Write-Host "  2. Download yt-dlp.exe from the latest release" -ForegroundColor Gray
    Write-Host "  3. Place it in: $BinDir" -ForegroundColor Gray
    exit 1
}
