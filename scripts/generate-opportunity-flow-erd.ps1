$ErrorActionPreference = 'Stop'
$summary = Import-Csv 'config/object-link-summary.csv'

$sourceAllow = @(
  'Opportunity_Approval__c','Opportunity_Snapshot__c','Opportunity',
  'SCMC__Customer_Quotation__c','SCMC__Customer_Quotation_Line__c',
  'SCMC__Sales_Order__c','SCMC__Sales_Order_Line_Item__c',
  'SCMC__Invoicing__c','Commission_Payment__c',
  'SCMC__Service_Order__c','SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c',
  'SCMC__Receipt__c','SCMC__Receipt_Line__c',
  'Account','Contact'
)

$targetAllow = @(
  'Opportunity','Account','Contact',
  'SCMC__Customer_Quotation__c','SCMC__Customer_Quotation_Line__c',
  'SCMC__Sales_Order__c','SCMC__Sales_Order_Line_Item__c',
  'SCMC__Invoicing__c','SCMC__Service_Order__c',
  'SCMC__Purchase_Order__c','SCMC__Purchase_Order_Line_Item__c',
  'SCMC__Receipt__c','SCMC__Receipt_Line__c',
  'Commission_Payment__c',
  'c2g__codaInvoice__c','c2g__codaCreditNote__c','c2g__codaCompany__c'
)

$edges = $summary | Where-Object {
  ($_.source_object -in $sourceAllow) -and
  ($_.target_object -in $targetAllow) -and
  ($_.target_object -notin @('User','RecordType')) -and
  ($_.source_object -ne $_.target_object)
} | Sort-Object source_object, target_object

$edges | Export-Csv -Path 'config/object-link-summary-oppty-flow.csv' -NoTypeInformation -Encoding UTF8

function Get-Label([string]$fields, [int]$count) {
  if ([string]::IsNullOrWhiteSpace($fields)) { return "lookup ($count)" }
  $first = ($fields -split ';')[0]
  if ($count -gt 1) { return "$first (+$($count-1) more)" }
  return $first
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('%% Focused ERD - Opportunity to Invoicing Flow') | Out-Null
$lines.Add('erDiagram') | Out-Null
foreach ($e in $edges) {
  $label = Get-Label -fields $e.fields -count ([int]$e.relationship_field_count)
  $safeLabel = $label.Replace('"',"'")
  $lines.Add("  $($e.source_object) }o--|| $($e.target_object) : `"$safeLabel`"") | Out-Null
}
$lines | Set-Content -Path 'config/erd-opportunity-flow.mmd' -Encoding UTF8

Write-Output "oppty_flow_edges=$($edges.Count)"
Write-Output "Wrote config/erd-opportunity-flow.mmd"
Write-Output "Wrote config/object-link-summary-oppty-flow.csv"
