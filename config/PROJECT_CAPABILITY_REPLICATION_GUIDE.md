# Salesforce Discovery and Integration Capability Guide

This guide documents exactly what was implemented in this project so far, including setup, tooling, extensions, scripts, execution order, and outputs.  
Use it as the bootstrap playbook for other Salesforce projects.

## 1. What was implemented

The project now has end-to-end capability to:

1. Connect to a Salesforce org via CLI and snapshot org metadata inventory.
2. Generate object relationship maps and focused ERDs.
3. Analyze active Flows, detect integration touchpoints, retrieve flow XML, and produce runbooks.
4. Analyze custom Apex (classes + triggers), detect API/callout/invocable patterns, and produce runbooks.
5. Produce executive `.docx` outputs for integration scoping and operational handover.

## 2. Environment and tooling used

### Core tooling

- Salesforce CLI: `@salesforce/cli/2.124.7`
- Node.js: `v24.13.1`
- Python: `3.13` (Windows Store build)
- Shell: PowerShell

### Python packages installed

- `python-docx==1.2.0`
- `pdf2image==1.17.0`
- `pillow==12.1.1`
- `lxml==6.0.2`
- `typing_extensions==4.15.0`

Install command used:

```powershell
python -m pip install --user python-docx pdf2image pillow lxml typing_extensions
```

### VS Code extensions used/recommended

From `.vscode/extensions.json`:

- `salesforce.salesforcedx-vscode`
- `redhat.vscode-xml`
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `financialforce.lana`

Recommended additional extension for ERD preview:

- A Mermaid preview extension (for example `bierner.markdown-mermaid`)

### System tools (optional but recommended)

These are required for DOCX visual page rendering checks:

- `soffice` (LibreOffice)
- `pdftoppm` (Poppler)

Not installed in this environment during execution.

## 3. Salesforce authentication pattern used

Project used an authenticated alias:

- `xeretec-sandfull01`

To authenticate in a new project:

```powershell
sf org login web --alias <your-alias> --instance-url https://test.salesforce.com
sf org list --json
```

## 4. Scripts added and purpose

### Org and object discovery

- `scripts/bootstrap-org-inventory.ps1`  
  Builds `config/org-info.json`, `config/objects.csv`, `config/sobjects.txt`.

### Object relationships and ERD outputs

- `scripts/build-relationship-map.ps1`  
  Builds `config/object-relationships.csv`, `config/object-link-summary.csv`.
- `scripts/generate-focused-erd.ps1`  
  Builds focused Mermaid ERDs for commercial + finance flows.
- `scripts/generate-opportunity-flow-erd.ps1`  
  Builds focused opportunity-to-invoice ERD.
- `scripts/render-erd-images.ps1`  
  Renders `.mmd` to `.png`/`.svg` with Mermaid CLI.
- `scripts/generate_api_integration_overview_doc.py`  
  Produces `config/Salesforce_API_Integration_Scoping_Overview.docx`.

### Flow analysis and runbooks

- `scripts/map_active_flows.py`  
  Pulls active flow metadata; creates map/touchpoint CSVs + package manifest.
- `scripts/generate_flow_runbook_top20.py`  
  Builds plain-English runbook from flow metadata (supports top-N or all).
- `scripts/export_flow_runbook_docx.py`  
  Exports markdown runbook to `.docx`.

### Apex analysis and runbooks

- `scripts/build-apex-custom-package.ps1`  
  Builds `config/apex-custom-package.xml` manifest from custom Apex CSV inventories.
- `scripts/analyze_apex_custom.py`  
  Analyzes custom Apex classes/triggers and API touchpoints; creates runbooks + stats.
- `scripts/export_apex_overview_docx.py`  
  Produces executive Apex integration overview `.docx`.
- `scripts/export_apex_runbook_docx.py`  
  Exports full Apex runbook `.docx`.

## 5. End-to-end execution order (for a new project)

Run from project root.

### Step A: Bootstrap config and org inventory

```powershell
mkdir .\config -Force
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-org-inventory.ps1 -TargetOrg <your-alias> -OutputDir config
```

### Step B: Build relationships and ERDs

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-relationship-map.ps1
powershell -ExecutionPolicy Bypass -File scripts\generate-focused-erd.ps1
powershell -ExecutionPolicy Bypass -File scripts\generate-opportunity-flow-erd.ps1
powershell -ExecutionPolicy Bypass -File scripts\render-erd-images.ps1
python scripts\generate_api_integration_overview_doc.py
```

### Step C: Flow investigation and documentation

```powershell
python scripts\map_active_flows.py --target-org <your-alias> --api-version 66.0
powershell -ExecutionPolicy Bypass -Command "sf project retrieve start --target-org <your-alias> --manifest config\flow-active-package.xml --output-dir config\flow-metadata-active --wait 120"
python scripts\generate_flow_runbook_top20.py --limit 20 --output-prefix flow-runbook-top20 --title "Top 20 Active Flow Runbook (System Behavior)"
python scripts\generate_flow_runbook_top20.py --limit 0 --output-prefix flow-runbook-all --title "All Active Flow Runbook (System Behavior)"
python scripts\export_flow_runbook_docx.py --input-md config\flow-runbook-all.md --input-csv config\flow-runbook-all.csv --output-docx config\flow-runbook-all.docx
```

### Step D: Apex investigation and documentation

```powershell
powershell -ExecutionPolicy Bypass -Command "sf data query --use-tooling-api --target-org <your-alias> --query ""SELECT Id, Name, NamespacePrefix, ApiVersion, LengthWithoutComments, Status FROM ApexClass WHERE NamespacePrefix = null ORDER BY Name"" --result-format csv --output-file config\apex-classes-custom.csv"
powershell -ExecutionPolicy Bypass -Command "sf data query --use-tooling-api --target-org <your-alias> --query ""SELECT Id, Name, NamespacePrefix, TableEnumOrId, ApiVersion, LengthWithoutComments, Status FROM ApexTrigger WHERE NamespacePrefix = null ORDER BY Name"" --result-format csv --output-file config\apex-triggers-custom.csv"
powershell -ExecutionPolicy Bypass -File scripts\build-apex-custom-package.ps1 -ClassesCsv config\apex-classes-custom.csv -TriggersCsv config\apex-triggers-custom.csv -OutputXml config\apex-custom-package.xml -ApiVersion 66.0
powershell -ExecutionPolicy Bypass -Command "sf project retrieve start --target-org <your-alias> --manifest config\apex-custom-package.xml --output-dir config\apex-metadata-custom --wait 120"
python scripts\analyze_apex_custom.py
python scripts\export_apex_overview_docx.py
python scripts\export_apex_runbook_docx.py --input-md config\apex-custom-runbook-all.md --input-csv config\apex-custom-runbook-all.csv --output-docx config\apex-custom-runbook-all.docx
```

## 6. Output inventory produced in this project

### Org and object baseline

- `config/org-info.json`
- `config/objects.csv`
- `config/sobjects.txt`

### Relationship and ERD artifacts

- `config/object-relationships.csv`
- `config/object-link-summary.csv`
- `config/object-link-summary-focused.csv`
- `config/object-link-summary-oppty-flow.csv`
- `config/erd-focused-commercial.*`
- `config/erd-focused-finance.*`
- `config/erd-opportunity-flow.*`
- `config/Salesforce_API_Integration_Scoping_Overview.docx`

### Flow artifacts

- `config/flow-definitions-all.csv`
- `config/flow-active-map.csv`
- `config/flow-active-touchpoints.csv`
- `config/flow-active-external-touchpoints.csv`
- `config/flow-active-external-flow-summary.csv`
- `config/flow-active-package.xml`
- `config/flow-metadata-active/flows/*.flow-meta.xml`
- `config/flow-runbook-top20.*`
- `config/flow-runbook-all.*`

### Apex artifacts

- `config/apex-classes-custom.csv`
- `config/apex-triggers-custom.csv`
- `config/apex-custom-package.xml`
- `config/apex-metadata-custom/classes/*.cls`
- `config/apex-metadata-custom/triggers/*.trigger`
- `config/apex-custom-code-map.csv`
- `config/apex-custom-touchpoints.csv`
- `config/apex-custom-runbook-all.*`
- `config/apex-custom-api-touchpoint-overview.md`
- `config/Apex_API_Integration_Scoping_Overview.docx`

## 7. Important notes for new projects

1. Alias changes:
   - `map_active_flows.py` supports `--target-org`; use this instead of editing code.
2. Scale:
   - Managed package Apex can be very large; start with customer-owned code (`NamespacePrefix = null`) for practical first-pass analysis.
3. Heuristics:
   - Flow/Apex external touchpoint detection is static-pattern based; always validate with SMEs.
4. Rendering:
   - If DOCX page rendering QA is required, install LibreOffice + Poppler (`soffice`, `pdftoppm`).
5. Security:
   - Do not store or commit access tokens; generated org metadata files are safe if they exclude tokens.

## 8. Minimal bootstrap checklist (copy/paste)

```powershell
# 1) prerequisites
sf --version
node -v
python --version

# 2) auth
sf org login web --alias <your-alias> --instance-url https://test.salesforce.com

# 3) inventory
mkdir .\config -Force
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-org-inventory.ps1 -TargetOrg <your-alias> -OutputDir config

# 4) relationships + erd
powershell -ExecutionPolicy Bypass -File scripts\build-relationship-map.ps1
powershell -ExecutionPolicy Bypass -File scripts\generate-focused-erd.ps1
powershell -ExecutionPolicy Bypass -File scripts\generate-opportunity-flow-erd.ps1
powershell -ExecutionPolicy Bypass -File scripts\render-erd-images.ps1

# 5) flow and apex runbooks
python scripts\map_active_flows.py --target-org <your-alias> --api-version 66.0
powershell -ExecutionPolicy Bypass -File scripts\build-apex-custom-package.ps1 -ClassesCsv config\apex-classes-custom.csv -TriggersCsv config\apex-triggers-custom.csv -OutputXml config\apex-custom-package.xml -ApiVersion 66.0
python scripts\analyze_apex_custom.py
```
