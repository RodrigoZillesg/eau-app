# PowerShell script to safely kill Node processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

# Get all node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    Write-Host "Found $count Node.js process(es)" -ForegroundColor Cyan
    
    # Kill each process gracefully
    foreach ($process in $nodeProcesses) {
        try {
            $processId = $process.Id
            Write-Host "Stopping process ID: $processId" -ForegroundColor Gray
            Stop-Process -Id $processId -Force
        }
        catch {
            Write-Host "Could not stop process: $_" -ForegroundColor Red
        }
    }
    
    # Wait for processes to terminate
    Start-Sleep -Seconds 2
    Write-Host "All Node.js processes stopped" -ForegroundColor Green
}
else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

# Also check for processes on port 5180
Write-Host "Checking port 5180..." -ForegroundColor Yellow
$portProcess = netstat -ano | findstr :5180
if ($portProcess) {
    Write-Host "Port 5180 is in use, attempting to free it..." -ForegroundColor Yellow
    $lines = $portProcess -split "`n"
    foreach ($line in $lines) {
        if ($line -match "LISTENING\s+(\d+)") {
            $pid = $matches[1]
            Write-Host "Killing process using port 5180 (PID: $pid)" -ForegroundColor Gray
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
            catch {
                Write-Host "Could not stop process on port: $_" -ForegroundColor Red
            }
        }
    }
    Start-Sleep -Seconds 1
    Write-Host "Port 5180 freed" -ForegroundColor Green
}
else {
    Write-Host "Port 5180 is free" -ForegroundColor Green
}

Write-Host "Ready to start development server!" -ForegroundColor Green