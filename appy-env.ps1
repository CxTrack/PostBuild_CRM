param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("mortgage", "public", "other")]
    [string]$Target
)

# Define paths
$envFolder = Join-Path $PSScriptRoot "envs"
$sourceFile = Join-Path $envFolder ".env-$Target"
$destinationFile = Join-Path $PSScriptRoot ".env"

# Check if source file exists
if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Environment file not found: $sourceFile" -ForegroundColor Red
    exit 1
}

# Copy and overwrite
Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "✅ Copied $sourceFile → $destinationFile" -ForegroundColor Green
