#!/usr/bin/env pwsh
# Docker Image Backup Script
# Untuk Aplikasi Reservasi

param(
    [string]$ImageName = "aplikasi-reservasi",
    [string]$ImageTag = "latest",
    [string]$BackupDir = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $BackupDir "$ImageName-backup-$timestamp.tar"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Docker Image Backup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if Docker is running
    Write-Host "Checking Docker daemon..." -ForegroundColor Yellow
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running. Please start Docker."
    }
    Write-Host "✓ Docker is running" -ForegroundColor Green

    # Check if image exists
    Write-Host "Checking if image exists..." -ForegroundColor Yellow
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^$ImageName`:$ImageTag`$"
    if (-not $imageExists) {
        throw "Image '$ImageName:$ImageTag' not found. Please build the image first."
    }
    Write-Host "✓ Image found: $ImageName:$ImageTag" -ForegroundColor Green

    # Create backup
    Write-Host "Creating backup: $backupFile" -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    docker save "$ImageName:$ImageTag" -o $backupFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create backup"
    }
    Write-Host "✓ Backup created successfully" -ForegroundColor Green

    # Verify backup file
    Write-Host "Verifying backup file..." -ForegroundColor Yellow
    $fileInfo = Get-Item $backupFile
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "✓ File size: $fileSizeMB MB" -ForegroundColor Green
    Write-Host "✓ Location: $($fileInfo.FullName)" -ForegroundColor Green

    # Display backup info
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Backup Completed Successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Image: $ImageName:$ImageTag" -ForegroundColor White
    Write-Host "File: $($fileInfo.Name)" -ForegroundColor White
    Write-Host "Size: $fileSizeMB MB" -ForegroundColor White
    Write-Host "Date: $timestamp" -ForegroundColor White
    Write-Host ""
    Write-Host "To restore this backup, run:" -ForegroundColor Yellow
    Write-Host "docker load -i '$backupFile'" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
