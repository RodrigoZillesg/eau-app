# Safe server restart script that won't kill Claude
# This script kills only the Vite dev server on port 5180

Write-Host "=== Safe Server Restart Script ===" -ForegroundColor Cyan
Write-Host "Finding processes using port 5180..." -ForegroundColor Yellow

# Find process using port 5180 specifically
$portInfo = netstat -ano | findstr ":5180"
if ($portInfo) {
    # Extract PIDs from netstat output
    $pids = @()
    foreach ($line in $portInfo) {
        if ($line -match "LISTENING\s+(\d+)") {
            $pid = $matches[1]
            if ($pid -and $pid -ne "0") {
                $pids += $pid
            }
        }
    }
    
    # Kill only the processes using port 5180
    if ($pids.Count -gt 0) {
        $uniquePids = $pids | Sort-Object -Unique
        Write-Host "Found processes on port 5180: $($uniquePids -join ', ')" -ForegroundColor Yellow
        
        foreach ($pid in $uniquePids) {
            try {
                # Get process info before killing
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Killing process: $($process.Name) (PID: $pid)" -ForegroundColor Red
                    Stop-Process -Id $pid -Force -ErrorAction Stop
                    Write-Host "Process killed successfully" -ForegroundColor Green
                } else {
                    Write-Host "Process $pid not found (may have already exited)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "Could not kill process $pid : $_" -ForegroundColor Red
            }
        }
        
        # Wait for port to be released
        Write-Host "Waiting for port to be released..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    } else {
        Write-Host "No processes found using port 5180" -ForegroundColor Green
    }
} else {
    Write-Host "Port 5180 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting development server on port 5180..." -ForegroundColor Cyan
Write-Host "Running: npm run dev" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev