param(
    [string]$ClassesCsv = "config/apex-classes-custom.csv",
    [string]$TriggersCsv = "config/apex-triggers-custom.csv",
    [string]$OutputXml = "config/apex-custom-package.xml",
    [string]$ApiVersion = "66.0"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ClassesCsv)) {
    throw "Missing classes CSV: $ClassesCsv"
}
if (-not (Test-Path $TriggersCsv)) {
    throw "Missing triggers CSV: $TriggersCsv"
}

$classes = Import-Csv $ClassesCsv | Select-Object -ExpandProperty Name
$triggers = Import-Csv $TriggersCsv | Select-Object -ExpandProperty Name

$pkg = @()
$pkg += '<?xml version="1.0" encoding="UTF-8"?>'
$pkg += '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'

if ($classes.Count -gt 0) {
    $pkg += '  <types>'
    foreach ($c in $classes) {
        $pkg += "    <members>$c</members>"
    }
    $pkg += '    <name>ApexClass</name>'
    $pkg += '  </types>'
}

if ($triggers.Count -gt 0) {
    $pkg += '  <types>'
    foreach ($t in $triggers) {
        $pkg += "    <members>$t</members>"
    }
    $pkg += '    <name>ApexTrigger</name>'
    $pkg += '  </types>'
}

$pkg += "  <version>$ApiVersion</version>"
$pkg += '</Package>'

$pkg | Set-Content $OutputXml -Encoding UTF8

Write-Output "Wrote $OutputXml"
Write-Output "ApexClass members: $($classes.Count)"
Write-Output "ApexTrigger members: $($triggers.Count)"
