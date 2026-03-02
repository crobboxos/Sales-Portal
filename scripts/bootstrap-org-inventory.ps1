param(
    [string]$TargetOrg = "xeretec-sandfull01",
    [string]$OutputDir = "config"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command sf -ErrorAction SilentlyContinue)) {
    throw "Salesforce CLI (sf) is not available in PATH."
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$orgList = sf org list --json | ConvertFrom-Json
$org = $orgList.result.nonScratchOrgs | Where-Object { $_.alias -eq $TargetOrg } | Select-Object -First 1

if (-not $org) {
    throw "Target org alias '$TargetOrg' not found in authenticated org list."
}

$standard = (sf sobject list --sobject standard --target-org $TargetOrg --json | ConvertFrom-Json).result
$custom = (sf sobject list --sobject custom --target-org $TargetOrg --json | ConvertFrom-Json).result

$all = @($standard + $custom | Sort-Object -Unique)

Set-Content -Path (Join-Path $OutputDir "sobjects.txt") -Value ($all -join "`n") -Encoding UTF8

$rows = @()
$rows += $standard | ForEach-Object { [PSCustomObject]@{ api_name = $_; category = "standard" } }
$rows += $custom | ForEach-Object { [PSCustomObject]@{ api_name = $_; category = "custom" } }
$rows | Sort-Object api_name, category | Export-Csv -Path (Join-Path $OutputDir "objects.csv") -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    alias = $org.alias
    username = $org.username
    orgId = $org.orgId
    instanceUrl = $org.instanceUrl
    apiVersion = $org.instanceApiVersion
    retrievedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json | Set-Content -Path (Join-Path $OutputDir "org-info.json") -Encoding UTF8

Write-Output "Wrote $(($all | Measure-Object).Count) unique objects to $OutputDir/sobjects.txt"
Write-Output "Wrote $(($rows | Measure-Object).Count) rows to $OutputDir/objects.csv"
Write-Output "Wrote $OutputDir/org-info.json"
