$ErrorActionPreference = 'Stop'
$alias = 'xeretec-sandfull01'
$chunkSize = 25

$customObjects = Import-Csv 'config/objects.csv' | Where-Object { $_.category -eq 'custom' } | Select-Object -ExpandProperty api_name
if (-not $customObjects -or $customObjects.Count -eq 0) { throw 'No custom objects found in config/objects.csv' }

$tmpDir = Join-Path $PWD '.tmp-relationship-map'
if (-not (Test-Path $tmpDir)) {
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
}

$allFieldRows = New-Object System.Collections.Generic.List[object]

for ($i = 0; $i -lt $customObjects.Count; $i += $chunkSize) {
    $end = [Math]::Min($i + $chunkSize - 1, $customObjects.Count - 1)
    $chunk = $customObjects[$i..$end]
    $quoted = $chunk | ForEach-Object { "'$_'" }
    $inClause = [string]::Join(',', $quoted)

    $query = "SELECT EntityDefinition.QualifiedApiName, EntityDefinitionId, QualifiedApiName, DataType, RelationshipName, ReferenceTo FROM FieldDefinition WHERE EntityDefinitionId IN ($inClause)"
    $chunkFile = Join-Path $tmpDir ("chunk_{0:D4}.json" -f [int]($i / $chunkSize))

    sf data query --use-tooling-api --target-org $alias --query $query --result-format json --output-file $chunkFile | Out-Null

    $result = Get-Content -Raw $chunkFile | ConvertFrom-Json
    foreach ($rec in $result.records) {
        $source = $rec.EntityDefinition.QualifiedApiName
        $field = $rec.QualifiedApiName
        $dataType = [string]$rec.DataType
        $relName = [string]$rec.RelationshipName

        $relationType = $null
        $targets = @()
        $targetResolution = 'None'

        $referenceToTargets = @()
        if ($null -ne $rec.ReferenceTo -and $null -ne $rec.ReferenceTo.referenceTo) {
            $referenceToTargets = @($rec.ReferenceTo.referenceTo | ForEach-Object { [string]$_ } | Where-Object { $_ -and $_.Trim().Length -gt 0 })
        }

        if ($referenceToTargets.Count -gt 0) {
            if ($dataType -match '^(Lookup|MasterDetail|External Lookup|Indirect Lookup)\((.*)\)$') {
                $relationType = $matches[1]
            }
            elseif ($dataType -eq 'Record Type') {
                $relationType = 'RecordType'
            }
            elseif ($dataType -eq 'Hierarchy') {
                $relationType = 'Hierarchy'
            }
            else {
                $relationType = 'Lookup'
            }

            $targets = $referenceToTargets
            $targetResolution = 'ReferenceTo'
        }
        elseif ($dataType -eq 'Hierarchy') {
            $relationType = 'Hierarchy'
            $targets = @($source)
            $targetResolution = 'DataType'
        }
        elseif ($dataType -eq 'Record Type') {
            $relationType = 'RecordType'
            $targets = @('RecordType')
            $targetResolution = 'DataType'
        }
        elseif ($dataType -match '^(Lookup|MasterDetail|External Lookup|Indirect Lookup)\((.*)\)$') {
            $relationType = $matches[1]
            $inside = $matches[2].Trim()
            if ($inside.Length -gt 0) {
                $targets = $inside.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
                $targetResolution = 'DataType'
            }
        }

        if (-not $relationType) { continue }
        if (($targets.Count -eq 0) -and [string]::IsNullOrWhiteSpace($relName)) { continue }

        if ($targets.Count -eq 0) {
            $allFieldRows.Add([PSCustomObject]@{
                source_object = $source
                field_api_name = $field
                relationship_name = $relName
                relationship_type = $relationType
                target_object = ''
                target_resolution = $targetResolution
                raw_data_type = $dataType
            }) | Out-Null
        }
        else {
            foreach ($target in $targets) {
                $allFieldRows.Add([PSCustomObject]@{
                    source_object = $source
                    field_api_name = $field
                    relationship_name = $relName
                    relationship_type = $relationType
                    target_object = $target
                    target_resolution = $targetResolution
                    raw_data_type = $dataType
                }) | Out-Null
            }
        }
    }

    Write-Output ("Processed chunk {0}-{1} of {2}" -f ($i + 1), ($end + 1), $customObjects.Count)
}

$relationshipFile = 'config/object-relationships.csv'
$summaryFile = 'config/object-link-summary.csv'

$allFieldRows |
    Sort-Object source_object, field_api_name, target_object |
    Export-Csv -Path $relationshipFile -NoTypeInformation -Encoding UTF8

$summary = $allFieldRows |
    Group-Object source_object, target_object |
    ForEach-Object {
        $first = $_.Group[0]
        [PSCustomObject]@{
            source_object = $first.source_object
            target_object = $first.target_object
            relationship_field_count = $_.Count
            fields = (($_.Group | Sort-Object field_api_name | Select-Object -ExpandProperty field_api_name -Unique) -join ';')
        }
    } |
    Sort-Object source_object, target_object

$summary | Export-Csv -Path $summaryFile -NoTypeInformation -Encoding UTF8

Write-Output "Wrote $($allFieldRows.Count) relationship rows to $relationshipFile"
Write-Output "Wrote $($summary.Count) source->target edges to $summaryFile"
