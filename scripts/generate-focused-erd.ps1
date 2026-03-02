$ErrorActionPreference = 'Stop'

$summaryPath = 'config/object-link-summary.csv'
if (-not (Test-Path $summaryPath)) {
    throw "Missing $summaryPath. Run scripts/build-relationship-map.ps1 first."
}

$summary = Import-Csv $summaryPath

function Get-Label {
    param(
        [string]$Fields,
        [int]$Count
    )

    $first = ''
    if (-not [string]::IsNullOrWhiteSpace($Fields)) {
        $first = ($Fields -split ';')[0]
    }

    if ([string]::IsNullOrWhiteSpace($first)) {
        return "lookup ($Count)"
    }

    if ($Count -gt 1) {
        return "$first (+$($Count - 1) more)"
    }

    return $first
}

function Write-MermaidErd {
    param(
        [string]$OutputPath,
        [string]$Title,
        [object[]]$Edges
    )

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("%% $Title") | Out-Null
    $lines.Add('erDiagram') | Out-Null

    foreach ($edge in $Edges) {
        $label = Get-Label -Fields $edge.fields -Count ([int]$edge.relationship_field_count)
        $label = $label.Replace('"', "'")
        $lines.Add("  $($edge.source_object) }o--|| $($edge.target_object) : `"$label`"") | Out-Null
    }

    Set-Content -Path $OutputPath -Value $lines -Encoding UTF8
}

function Get-FilteredEdges {
    param(
        [object[]]$InputEdges,
        [string[]]$SourceAllow,
        [string[]]$TargetAllow,
        [string[]]$TargetExclude = @('User', 'RecordType'),
        [switch]$ExcludeSelf
    )

    $filtered = $InputEdges | Where-Object {
        ($_.source_object -in $SourceAllow) -and ($_.target_object -in $TargetAllow) -and ($_.target_object -notin $TargetExclude)
    }

    if ($ExcludeSelf.IsPresent) {
        $filtered = $filtered | Where-Object { $_.source_object -ne $_.target_object }
    }

    return $filtered | Sort-Object source_object, target_object
}

$commercialSources = @(
    'Opportunity_Approval__c','Opportunity_Snapshot__c','MACD__c','MACD_Line_Item__c','Commission_Payment__c',
    'SCMC__Customer_Quotation__c','SCMC__Customer_Quotation_Line__c','SCMC__Sales_Order__c','SCMC__Sales_Order_Line_Item__c',
    'SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c','SCMC__Receipt__c','SCMC__Receipt_Line__c',
    'SCMC__Inventory_Position__c','SCMC__Exchange_Order__c','SCMC__Service_Order__c','SCMC__Invoicing__c'
)

$commercialTargets = @(
    'Account','Contact','Opportunity',
    'MACD__c','SCMC__Invoicing__c','SCMC__Item__c','SCMC__Customer_Quotation__c','SCMC__Customer_Quotation_Line__c',
    'SCMC__Sales_Order__c','SCMC__Sales_Order_Line_Item__c','SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c',
    'SCMC__Receipt__c','SCMC__Receipt_Line__c','SCMC__Inventory_Position__c','SCMC__Exchange_Order__c','SCMC__Service_Order__c',
    'c2g__codaCompany__c','c2g__codaInvoice__c','c2g__codaCreditNote__c','c2g__codaTransaction__c'
)

$financeSources = @(
    'SCMC__Invoicing__c','SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c','Commission_Payment__c',
    'c2g__codaInvoice__c','c2g__codaCreditNote__c','c2g__codaJournalLineItem__c','c2g__codaTransaction__c',
    'c2g__codaIntercompanyTransfer__c','c2g__codaIntercompanyTransferLineItem__c','c2g__codaCompany__c','c2g__ConsolidationHierarchyLine__c'
)

$financeTargets = @(
    'Account','Opportunity','SCMC__Invoicing__c','SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c',
    'c2g__codaCompany__c','c2g__codaInvoice__c','c2g__codaCreditNote__c','c2g__codaTransaction__c','c2g__codaIntercompanyTransfer__c',
    'c2g__codaGeneralLedgerAccount__c'
)

$commercialEdges = Get-FilteredEdges -InputEdges $summary -SourceAllow $commercialSources -TargetAllow $commercialTargets -ExcludeSelf
$financeEdges = Get-FilteredEdges -InputEdges $summary -SourceAllow $financeSources -TargetAllow $financeTargets -ExcludeSelf

$allFocused = @($commercialEdges + $financeEdges | Sort-Object source_object, target_object -Unique)
$allFocused | Export-Csv -Path 'config/object-link-summary-focused.csv' -NoTypeInformation -Encoding UTF8

Write-MermaidErd -OutputPath 'config/erd-focused-commercial.mmd' -Title 'Focused ERD - Commercial Flow' -Edges $commercialEdges
Write-MermaidErd -OutputPath 'config/erd-focused-finance.mmd' -Title 'Focused ERD - Finance Integration' -Edges $financeEdges

$readme = @(
    '# Focused ERD Outputs',
    '',
    '- `erd-focused-commercial.mmd`: CRM + SCMC commercial order flow.',
    '- `erd-focused-finance.mmd`: SCMC to c2g finance integration flow.',
    '- `object-link-summary-focused.csv`: Union of links used by both diagrams.',
    '',
    'Render options:',
    '- VS Code Mermaid preview extension',
    '- Any Mermaid-compatible markdown viewer'
)
$readme | Set-Content -Path 'config/erd-focused-README.md' -Encoding UTF8

Write-Output "commercial_edges=$($commercialEdges.Count)"
Write-Output "finance_edges=$($financeEdges.Count)"
Write-Output "focused_union_edges=$($allFocused.Count)"
Write-Output "Wrote config/erd-focused-commercial.mmd"
Write-Output "Wrote config/erd-focused-finance.mmd"
Write-Output "Wrote config/object-link-summary-focused.csv"
Write-Output "Wrote config/erd-focused-README.md"
