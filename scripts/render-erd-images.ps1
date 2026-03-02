$ErrorActionPreference = 'Stop'
$files = @(
  'config/erd-focused-commercial.mmd',
  'config/erd-focused-finance.mmd',
  'config/erd-opportunity-flow.mmd'
)
foreach ($f in $files) {
  if (-not (Test-Path $f)) { throw "Missing diagram file: $f" }
  $base = [System.IO.Path]::GetFileNameWithoutExtension($f)
  $svg = "config/$base.svg"
  $png = "config/$base.png"

  npx -y @mermaid-js/mermaid-cli -i $f -o $svg -e svg -t neutral -w 2200 -H 1600 -b white | Out-Null
  npx -y @mermaid-js/mermaid-cli -i $f -o $png -e png -t neutral -w 2200 -H 1600 -b white | Out-Null

  Write-Output "Rendered $svg"
  Write-Output "Rendered $png"
}
