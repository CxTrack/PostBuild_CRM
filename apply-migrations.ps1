param(
    [Parameter(Mandatory = $true)]
    [string]$Target
)

# Stop on any error
$ErrorActionPreference = "Stop"

# Base paths
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationsDir = Join-Path $baseDir "supabase\migrations"

 Write-Host "------ migrationDir: " $migrationsDir

$buildDir = $migrationsDir 

# Copy general migrations
$generalPath = Join-Path $migrationsDir "general\*.sql"
if (Test-Path (Split-Path $generalPath)) {
    Write-Host "Copying general migrations..."
    Copy-Item $generalPath $buildDir
} else {
    Write-Host "⚠️  No general migrations found."
}

# Copy target-specific migrations
$targetPath = Join-Path $migrationsDir "$Target\*.sql"
if (Test-Path (Split-Path $targetPath)) {
    Write-Host "Copying $Target migrations..."
    Copy-Item $targetPath $buildDir
} else {
    Write-Host "⚠️  No $Target migrations found."
}

# Apply migrations using supabase CLI
Write-Host "Running supabase db push..."
& "$baseDir\supabase.exe" db push

Write-Host "✅ Migrations applied successfully for target '$Target'!"

Write-Host "✅ Cleaning up migration folder..."

# Clean root of migration folder
Get-ChildItem -Path $buildDir -File | ForEach-Object {
    Write-Host "Deleting file: $($_.FullName)"
    Remove-Item $_.FullName -Force
}

Write-Host "✅ Migration folder cleanup is complete!"