$ErrorActionPreference = "Stop"

$nodeBin = "C:\Program Files\nodejs"
if (Test-Path $nodeBin) {
  $env:Path = "$nodeBin;$env:Path"
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Host "Node.js/npm is not installed or not available in this session. Install Node.js 20+ first, then rerun this script." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path "node_modules")) {
  & $npm.Source install
}

& $npm.Source run dev
