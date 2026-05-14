# deploy-functions-v2.ps1
#
# Upgrades getPathway to 2nd gen (Cloud Run).
#
# REQUIRED PERMISSION (request from project owner):
#   roles/functions.admin on project-rebound
#   https://console.cloud.google.com/iam-admin/iam?project=project-rebound
#
# Run from NathanFork/CanvasSample/ once you have the role.

$ErrorActionPreference = "Stop"

Write-Host "Swapping functions/index.js to v2..." -ForegroundColor Cyan
Copy-Item functions\index.v2.js functions\index.js -Force

Write-Host "Deploying..." -ForegroundColor Cyan
firebase deploy --only functions

Write-Host "Done. getPathway is now running on Cloud Run (2nd gen)." -ForegroundColor Green
