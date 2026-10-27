#!/usr/bin/env pwsh
# Docker Image Restore Script
# Untuk Aplikasi Reservasi

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Docker Image Restore Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Validate backup file
    Write-Host "Validating backup file..." -ForegroundColor Yellow
    if (-not (Test-Path $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }
    
    $fileInfo = Get-Item $BackupFile
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "✓ File found: $($fileInfo.Name)" -ForegroundColor Green
    Write-Host "✓ File size: $fileSizeMB MB" -ForegroundColor Green

    # Check Docker daemon
    Write-Host "Checking Docker daemon..." -ForegroundColor Yellow
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running. Please start Docker."
    }
    Write-Host "✓ Docker is running" -ForegroundColor Green

    # Load image
    Write-Host "Loading Docker image from backup..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    docker load -i $BackupFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to restore from backup"
    }
    Write-Host "✓ Image restored successfully" -ForegroundColor Green

    # List restored images
    Write-Host ""
    Write-Host "Restored images:" -ForegroundColor Yellow
    docker images | Select-String "aplikasi-reservasi|REPOSITORY"

    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Restore Completed Successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the container:" -ForegroundColor Yellow
    Write-Host "docker run -p 3000:3000 aplikasi-reservasi:latest" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
