param(
    # Keeping the Target parameter optional for future use, but defaulting to 'general' deployment logic
    [string]$Target
)

$functionsRoot = "supabase/functions"
$targetFolder = "general"

Write-Host "Starting deployment for functions in: $targetFolder"

# Store the original location to return to later
$originalLocation = Get-Location

# 1. Calculate the absolute path to the 'general' folder
$generalFolderPathAbsolute = Join-Path -Path $originalLocation.Path -ChildPath $functionsRoot | Join-Path -ChildPath $targetFolder


Write-Host "1-------: $generalFolderPathAbsolute"

if (-Not (Test-Path $generalFolderPathAbsolute)) {
    Write-Host "❌ Error: Target folder not found: $generalFolderPathAbsolute"
    # Exit gracefully if the 'general' folder doesn't exist
    return
}

# 2. Get all sub-directories (the function folders) inside 'general'
$functionDirs = Get-ChildItem -Path $generalFolderPathAbsolute -Directory

 Write-Host "2-------: $functionDirs"

if ($functionDirs.Count -eq 0) {
    Write-Host "No functions found in folder: $generalFolderPathAbsolute"
    # Return to original location before exiting
    Set-Location $originalLocation
    return
}

# --- CRITICAL FIX: Change CWD to the function's immediate parent folder (general) ---
Set-Location $generalFolderPathAbsolute
Write-Host "Deployment CWD set to: $((Get-Location).Path)"

Write-Host "3------:  $((Get-Location).Path)"

foreach ($func in $functionDirs) {
    $funcName = $func.Name
    
    # Skip system folders like 'supabase'
    if ($funcName -ceq "supabase") {
         Write-Host "Skipping system folder: $funcName"
         continue
    }

    Write-Host "Deploying function: $funcName ..."


    # Deploy using only the simple function name. The CLI is now in the correct parent directory.
    $argumentList = "functions deploy $funcName" 
    $deployProcess = Start-Process -FilePath "supabase" -ArgumentList $argumentList -NoNewWindow -Wait -PassThru

    if ($deployProcess.ExitCode -eq 0) {
        Write-Host "✅ Successfully deployed: $funcName"
    } else {
        Write-Host "❌ Deployment failed for: $funcName (Exit Code: $($deployProcess.ExitCode))"
    }
}

# Restore original location
Set-Location $originalLocation
Write-Host "Deployment finished. Returned to: $((Get-Location).Path)"
[System.Console]::ReadKey($true) | Out-Null