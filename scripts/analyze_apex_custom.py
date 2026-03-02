from __future__ import annotations

import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"

CLASSES_CSV = CONFIG_DIR / "apex-classes-custom.csv"
TRIGGERS_CSV = CONFIG_DIR / "apex-triggers-custom.csv"
CLASSES_DIR = CONFIG_DIR / "apex-metadata-custom" / "classes"
TRIGGERS_DIR = CONFIG_DIR / "apex-metadata-custom" / "triggers"

OUT_MAP = CONFIG_DIR / "apex-custom-code-map.csv"
OUT_TP = CONFIG_DIR / "apex-custom-touchpoints.csv"
OUT_RUNBOOK_CSV = CONFIG_DIR / "apex-custom-runbook-all.csv"
OUT_RUNBOOK_MD = CONFIG_DIR / "apex-custom-runbook-all.md"
OUT_OVERVIEW_MD = CONFIG_DIR / "apex-custom-api-touchpoint-overview.md"
OUT_STATS_JSON = CONFIG_DIR / "apex-custom-analysis-stats.json"


BUILTIN_CLASS_PREFIXES = {
    "System",
    "Database",
    "Math",
    "String",
    "Date",
    "DateTime",
    "Time",
    "Blob",
    "JSON",
    "JSONParser",
    "Schema",
    "UserInfo",
    "Limits",
    "Test",
    "LoggingLevel",
    "ApexPages",
    "Messaging",
    "RestContext",
    "Trigger",
    "EventBus",
    "Crypto",
    "EncodingUtil",
    "Label",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def count_lines(text: str) -> int:
    if not text:
        return 0
    return text.count("\n") + 1


def uniq(seq: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for s in seq:
        if not s:
            continue
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


def find_sharing_model(code: str) -> str:
    m = re.search(
        r"\b(public|global|private|protected)?\s*(with sharing|without sharing|inherited sharing)\s+class\b",
        code,
        flags=re.IGNORECASE,
    )
    if not m:
        return ""
    return m.group(2)


def extract_endpoints(code: str) -> list[str]:
    vals: list[str] = []
    patterns = [
        r"setEndpoint\(\s*'([^']+)'\s*\)",
        r'setEndpoint\(\s*"([^"]+)"\s*\)',
        r"URL\.getSalesforceBaseUrl\(\)",
    ]
    for pat in patterns:
        vals.extend(re.findall(pat, code, flags=re.IGNORECASE))
    return uniq(vals)


def extract_custom_object_refs(code: str) -> list[str]:
    # Heuristic for object symbols (not field symbols).
    refs = re.findall(r"\b([A-Za-z][A-Za-z0-9_]*__(?:c|mdt|e))\b", code)
    return uniq(refs)


def artifact_summary(row: dict[str, Any]) -> str:
    name = row["name"]
    atype = row["artifact_type"]
    if atype == "Trigger":
        obj = row.get("primary_object", "")
        events = row.get("trigger_events", "")
        return f"Trigger on {obj} ({events})"

    parts = []
    if row.get("has_rest_resource") == "Y":
        parts.append("REST endpoint")
    if row.get("has_invocable") == "Y":
        parts.append("Flow invocable")
    if row.get("has_callout") == "Y":
        parts.append("HTTP/callout logic")
    async_patterns = row.get("async_patterns", "")
    if async_patterns:
        parts.append(f"async={async_patterns}")
    if not parts:
        parts.append("utility/business logic class")
    return f"{name}: " + ", ".join(parts)


def bool_flag(val: bool) -> str:
    return "Y" if val else "N"


def build_touchpoints_for_class(
    name: str,
    code: str,
    has_callout: bool,
    has_rest: bool,
    has_invocable: bool,
    async_patterns: list[str],
    endpoints: list[str],
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    if has_rest:
        rest_paths = re.findall(r"@RestResource\s*\(\s*urlMapping\s*=\s*'([^']+)'", code, flags=re.IGNORECASE)
        if not rest_paths:
            rest_paths = re.findall(r'@RestResource\s*\(\s*urlMapping\s*=\s*"([^"]+)"', code, flags=re.IGNORECASE)
        if rest_paths:
            for path in rest_paths:
                rows.append(
                    {
                        "artifact_type": "Class",
                        "name": name,
                        "touchpoint_type": "InboundREST",
                        "touchpoint_detail": path,
                        "external_candidate": "Y",
                    }
                )
        else:
            rows.append(
                {
                    "artifact_type": "Class",
                    "name": name,
                    "touchpoint_type": "InboundREST",
                    "touchpoint_detail": "@RestResource",
                    "external_candidate": "Y",
                }
            )

    if has_invocable:
        rows.append(
            {
                "artifact_type": "Class",
                "name": name,
                "touchpoint_type": "FlowInvocable",
                "touchpoint_detail": "@InvocableMethod",
                "external_candidate": "N",
            }
        )

    if has_callout:
        rows.append(
            {
                "artifact_type": "Class",
                "name": name,
                "touchpoint_type": "HttpCalloutLogic",
                "touchpoint_detail": "HTTP/callout-related code detected",
                "external_candidate": "Y",
            }
        )

    for pat in async_patterns:
        rows.append(
            {
                "artifact_type": "Class",
                "name": name,
                "touchpoint_type": "AsyncPattern",
                "touchpoint_detail": pat,
                "external_candidate": "N",
            }
        )

    for ep in endpoints:
        ext = "Y"
        if ep.lower().startswith("callout:"):
            tp = "NamedCredentialCallout"
        else:
            tp = "HttpCalloutEndpoint"
        rows.append(
            {
                "artifact_type": "Class",
                "name": name,
                "touchpoint_type": tp,
                "touchpoint_detail": ep,
                "external_candidate": ext,
            }
        )

    return rows


def parse_trigger_signature(code: str) -> tuple[str, str]:
    m = re.search(r"\btrigger\s+([A-Za-z0-9_]+)\s+on\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)", code, re.IGNORECASE)
    if not m:
        return "", ""
    obj = m.group(2).strip()
    events = ",".join([e.strip() for e in m.group(3).split(",") if e.strip()])
    return obj, events


def detect_async_patterns(code: str) -> list[str]:
    patterns: list[str] = []
    if re.search(r"\b@future\b", code):
        patterns.append("@future")
    if re.search(r"\bimplements\s+[^{};]*\bQueueable\b", code):
        patterns.append("Queueable")
    if re.search(r"\bimplements\s+[^{};]*\bDatabase\.Batchable\b", code):
        patterns.append("Database.Batchable")
    if re.search(r"\bimplements\s+[^{};]*\bSchedulable\b", code):
        patterns.append("Schedulable")
    if re.search(r"\bDatabase\.executeBatch\s*\(", code):
        patterns.append("Database.executeBatch")
    if re.search(r"\bSystem\.enqueueJob\s*\(", code):
        patterns.append("System.enqueueJob")
    if re.search(r"\bSystem\.schedule\s*\(", code):
        patterns.append("System.schedule")
    return uniq(patterns)


def integration_score(row: dict[str, Any]) -> int:
    score = 0
    if row.get("has_callout") == "Y":
        score += 80
    if row.get("has_rest_resource") == "Y":
        score += 90
    if row.get("has_named_credential") == "Y":
        score += 30
    if row.get("has_invocable") == "Y":
        score += 25
    score += int(row.get("touchpoint_count", "0")) * 8
    score += min(40, int(row.get("soql_count", "0")) * 2)
    score += min(40, int(row.get("dml_keyword_count", "0")) * 2)
    if row.get("artifact_type") == "Trigger":
        score += 30
        events = row.get("trigger_events", "").lower()
        if "after insert" in events or "after update" in events:
            score += 20
    obj = (row.get("primary_object", "") or "").strip()
    key_objs = {
        "Opportunity": 35,
        "OpportunityLineItem": 25,
        "SCMC__Sales_Order__c": 35,
        "SCMC__Sales_Order_Line_Item__c": 35,
        "SCMC__Invoicing__c": 35,
        "SCMC__Purchase_Order__c": 25,
        "SCMC__Purchase_Order_Line_Item__c": 25,
        "Account": 20,
        "Contact": 15,
    }
    score += key_objs.get(obj, 0)
    if row.get("is_test") == "Y":
        score -= 70
    return max(0, score)


def main() -> None:
    class_rows = read_csv(CLASSES_CSV)
    trigger_rows = read_csv(TRIGGERS_CSV)

    class_index = {r["Name"]: r for r in class_rows}
    trigger_index = {r["Name"]: r for r in trigger_rows}

    custom_class_names = set(class_index.keys())

    code_rows: list[dict[str, Any]] = []
    touchpoint_rows: list[dict[str, str]] = []

    # Analyze classes
    for path in sorted(CLASSES_DIR.glob("*.cls")):
        name = path.stem
        meta = class_index.get(name, {})
        code = path.read_text(encoding="utf-8-sig", errors="ignore")

        lines = count_lines(code)
        is_test = bool(
            re.search(r"@isTest\b", code, flags=re.IGNORECASE)
            or re.search(r"\btestMethod\b", code, flags=re.IGNORECASE)
            or name.lower().endswith("test")
            or name.lower().endswith("testsuite")
        )

        has_callout = bool(
            re.search(r"\bHttpRequest\b", code)
            or re.search(r"\bnew\s+Http\s*\(", code)
            or re.search(r"\bWebServiceCallout\b", code)
            or re.search(r"\bsetEndpoint\s*\(", code)
            or re.search(r"\bcallout:", code, flags=re.IGNORECASE)
        )
        has_named_credential = bool(re.search(r"\bcallout:", code, flags=re.IGNORECASE))
        has_rest = bool(re.search(r"@RestResource\b", code, flags=re.IGNORECASE))
        has_invocable = bool(re.search(r"@InvocableMethod\b", code, flags=re.IGNORECASE))
        has_aura = bool(re.search(r"@AuraEnabled\b", code, flags=re.IGNORECASE))

        async_patterns = detect_async_patterns(code)
        endpoints = extract_endpoints(code)

        soql_count = len(re.findall(r"\[\s*SELECT\b", code, flags=re.IGNORECASE)) + len(
            re.findall(r"\bDatabase\.query\s*\(", code)
        )
        sosl_count = len(re.findall(r"\[\s*FIND\b", code, flags=re.IGNORECASE)) + len(
            re.findall(r"\bSearch\.query\s*\(", code)
        )
        dml_count = len(
            re.findall(
                r"\b(insert|update|upsert|delete|undelete|merge)\b",
                code,
                flags=re.IGNORECASE,
            )
        ) + len(re.findall(r"\bDatabase\.(insert|update|upsert|delete|undelete|merge)\b", code))

        object_refs = extract_custom_object_refs(code)
        sharing_model = find_sharing_model(code)

        class_touchpoints = build_touchpoints_for_class(
            name=name,
            code=code,
            has_callout=has_callout,
            has_rest=has_rest,
            has_invocable=has_invocable,
            async_patterns=async_patterns,
            endpoints=endpoints,
        )
        touchpoint_rows.extend(class_touchpoints)

        row = {
            "artifact_type": "Class",
            "name": name,
            "status": meta.get("Status", ""),
            "namespace_prefix": meta.get("NamespacePrefix", ""),
            "api_version": meta.get("ApiVersion", ""),
            "path": str(path.relative_to(ROOT)),
            "lines": str(lines),
            "is_test": bool_flag(is_test),
            "sharing_model": sharing_model,
            "primary_object": "",
            "trigger_events": "",
            "has_rest_resource": bool_flag(has_rest),
            "has_invocable": bool_flag(has_invocable),
            "has_aura_enabled": bool_flag(has_aura),
            "has_callout": bool_flag(has_callout),
            "has_named_credential": bool_flag(has_named_credential),
            "async_patterns": ";".join(async_patterns),
            "soql_count": str(soql_count),
            "sosl_count": str(sosl_count),
            "dml_keyword_count": str(dml_count),
            "handler_class_refs": "",
            "custom_object_refs": ";".join(object_refs[:30]),
            "touchpoint_count": str(len(class_touchpoints)),
            "summary": "",
            "integration_score": "0",
        }
        row["integration_score"] = str(integration_score(row))
        row["summary"] = artifact_summary(row)
        code_rows.append(row)

    # Analyze triggers
    for path in sorted(TRIGGERS_DIR.glob("*.trigger")):
        name = path.stem
        meta = trigger_index.get(name, {})
        code = path.read_text(encoding="utf-8-sig", errors="ignore")
        lines = count_lines(code)

        primary_object, events = parse_trigger_signature(code)
        has_callout = bool(
            re.search(r"\bHttpRequest\b", code)
            or re.search(r"\bnew\s+Http\s*\(", code)
            or re.search(r"\bWebServiceCallout\b", code)
            or re.search(r"\bsetEndpoint\s*\(", code)
            or re.search(r"\bcallout:", code, flags=re.IGNORECASE)
        )
        has_named_credential = bool(re.search(r"\bcallout:", code, flags=re.IGNORECASE))

        soql_count = len(re.findall(r"\[\s*SELECT\b", code, flags=re.IGNORECASE)) + len(
            re.findall(r"\bDatabase\.query\s*\(", code)
        )
        sosl_count = len(re.findall(r"\[\s*FIND\b", code, flags=re.IGNORECASE)) + len(
            re.findall(r"\bSearch\.query\s*\(", code)
        )
        dml_count = len(
            re.findall(
                r"\b(insert|update|upsert|delete|undelete|merge)\b",
                code,
                flags=re.IGNORECASE,
            )
        ) + len(re.findall(r"\bDatabase\.(insert|update|upsert|delete|undelete|merge)\b", code))

        # Handler references: class names used by trigger.
        handler_refs = [cn for cn in custom_class_names if re.search(rf"\b{re.escape(cn)}\b", code)]
        handler_refs = [h for h in handler_refs if h not in BUILTIN_CLASS_PREFIXES and h != name]
        handler_refs = sorted(set(handler_refs))

        object_refs = extract_custom_object_refs(code)

        trigger_touchpoints: list[dict[str, str]] = []
        if has_callout:
            trigger_touchpoints.append(
                {
                    "artifact_type": "Trigger",
                    "name": name,
                    "touchpoint_type": "CalloutInTrigger",
                    "touchpoint_detail": "HTTP/callout-related code detected",
                    "external_candidate": "Y",
                }
            )
        if handler_refs:
            trigger_touchpoints.append(
                {
                    "artifact_type": "Trigger",
                    "name": name,
                    "touchpoint_type": "TriggerHandler",
                    "touchpoint_detail": ";".join(handler_refs[:8]),
                    "external_candidate": "N",
                }
            )
        touchpoint_rows.extend(trigger_touchpoints)

        row = {
            "artifact_type": "Trigger",
            "name": name,
            "status": meta.get("Status", ""),
            "namespace_prefix": meta.get("NamespacePrefix", ""),
            "api_version": meta.get("ApiVersion", ""),
            "path": str(path.relative_to(ROOT)),
            "lines": str(lines),
            "is_test": "N",
            "sharing_model": "",
            "primary_object": primary_object or meta.get("TableEnumOrId", ""),
            "trigger_events": events,
            "has_rest_resource": "N",
            "has_invocable": "N",
            "has_aura_enabled": "N",
            "has_callout": bool_flag(has_callout),
            "has_named_credential": bool_flag(has_named_credential),
            "async_patterns": "",
            "soql_count": str(soql_count),
            "sosl_count": str(sosl_count),
            "dml_keyword_count": str(dml_count),
            "handler_class_refs": ";".join(handler_refs[:30]),
            "custom_object_refs": ";".join(object_refs[:30]),
            "touchpoint_count": str(len(trigger_touchpoints)),
            "summary": "",
            "integration_score": "0",
        }
        row["integration_score"] = str(integration_score(row))
        row["summary"] = artifact_summary(row)
        code_rows.append(row)

    # Sort by integration score then name
    code_rows = sorted(
        code_rows,
        key=lambda r: (int(r["integration_score"]), r["artifact_type"], r["name"]),
        reverse=True,
    )

    # Write map CSV
    map_fields = [
        "artifact_type",
        "name",
        "status",
        "namespace_prefix",
        "api_version",
        "path",
        "lines",
        "is_test",
        "sharing_model",
        "primary_object",
        "trigger_events",
        "has_rest_resource",
        "has_invocable",
        "has_aura_enabled",
        "has_callout",
        "has_named_credential",
        "async_patterns",
        "soql_count",
        "sosl_count",
        "dml_keyword_count",
        "handler_class_refs",
        "custom_object_refs",
        "touchpoint_count",
        "integration_score",
        "summary",
    ]
    with OUT_MAP.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=map_fields)
        writer.writeheader()
        writer.writerows(code_rows)

    # Write touchpoints CSV
    tp_fields = ["artifact_type", "name", "touchpoint_type", "touchpoint_detail", "external_candidate"]
    with OUT_TP.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=tp_fields)
        writer.writeheader()
        writer.writerows(touchpoint_rows)

    # Runbook CSV with rank
    runbook_rows: list[dict[str, str]] = []
    for i, r in enumerate(code_rows, start=1):
        runbook_rows.append(
            {
                "rank": str(i),
                "artifact_type": r["artifact_type"],
                "name": r["name"],
                "integration_score": r["integration_score"],
                "primary_object": r["primary_object"],
                "trigger_events": r["trigger_events"],
                "has_callout": r["has_callout"],
                "has_rest_resource": r["has_rest_resource"],
                "has_invocable": r["has_invocable"],
                "async_patterns": r["async_patterns"],
                "soql_count": r["soql_count"],
                "dml_keyword_count": r["dml_keyword_count"],
                "touchpoint_count": r["touchpoint_count"],
                "summary": r["summary"],
                "path": r["path"],
            }
        )
    runbook_fields = list(runbook_rows[0].keys()) if runbook_rows else []
    with OUT_RUNBOOK_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=runbook_fields)
        writer.writeheader()
        writer.writerows(runbook_rows)

    # Markdown runbook (all rows)
    md: list[str] = []
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    md.append("# Apex Runbook (Custom Namespace - All Artifacts)")
    md.append("")
    md.append(f"Generated: {now_utc}")
    md.append("Scope: `NamespacePrefix = null` (customer-owned Apex only).")
    md.append("")
    md.append("## Ranked Inventory")
    md.append("")
    for r in runbook_rows:
        md.append(
            f"- {r['rank']}. `{r['artifact_type']} {r['name']}` "
            f"(score {r['integration_score']}, touchpoints {r['touchpoint_count']})"
        )
    md.append("")
    md.append("## Artifact Details")
    md.append("")
    tp_by_artifact: dict[tuple[str, str], list[dict[str, str]]] = {}
    for t in touchpoint_rows:
        tp_by_artifact.setdefault((t["artifact_type"], t["name"]), []).append(t)

    for r in runbook_rows:
        key = (r["artifact_type"], r["name"])
        tps = tp_by_artifact.get(key, [])
        md.append(f"## {r['rank']}. {r['artifact_type']} {r['name']}")
        md.append("")
        md.append(f"- Score: {r['integration_score']}")
        if r["artifact_type"] == "Trigger":
            md.append(f"- Trigger context: `{r['primary_object']}` / `{r['trigger_events']}`")
        else:
            md.append(
                f"- Class profile: callout `{r['has_callout']}`, rest `{r['has_rest_resource']}`, "
                f"invocable `{r['has_invocable']}`, async `{r['async_patterns'] or 'None'}`"
            )
        md.append(
            f"- Query/DML indicators: SOQL `{r['soql_count']}`, DML keywords `{r['dml_keyword_count']}`"
        )
        md.append(f"- Summary: {r['summary']}")
        md.append(f"- Source: `{r['path']}`")

        detail_row = next((x for x in code_rows if x["name"] == r["name"] and x["artifact_type"] == r["artifact_type"]), None)
        if detail_row:
            if detail_row.get("handler_class_refs"):
                md.append(f"- Handler references: {detail_row['handler_class_refs']}")
            if detail_row.get("custom_object_refs"):
                md.append(f"- Custom object references: {detail_row['custom_object_refs']}")

        if tps:
            md.append("- Touchpoints:")
            for tp in tps[:10]:
                md.append(
                    f"  - {tp['touchpoint_type']}: {tp['touchpoint_detail']} "
                    f"(external_candidate={tp['external_candidate']})"
                )
        else:
            md.append("- Touchpoints: none detected.")
        md.append("")

    OUT_RUNBOOK_MD.write_text("\n".join(md), encoding="utf-8")

    # Overview markdown and stats
    class_count = sum(1 for r in code_rows if r["artifact_type"] == "Class")
    trigger_count = sum(1 for r in code_rows if r["artifact_type"] == "Trigger")
    test_class_count = sum(1 for r in code_rows if r["artifact_type"] == "Class" and r["is_test"] == "Y")
    callout_artifacts = [r for r in code_rows if r["has_callout"] == "Y"]
    rest_artifacts = [r for r in code_rows if r["has_rest_resource"] == "Y"]
    invocable_artifacts = [r for r in code_rows if r["has_invocable"] == "Y"]
    external_tp_count = sum(1 for t in touchpoint_rows if t["external_candidate"] == "Y")

    top_scores = code_rows[:15]
    tp_type_counts = Counter(t["touchpoint_type"] for t in touchpoint_rows)
    trigger_obj_counts = Counter(r["primary_object"] for r in code_rows if r["artifact_type"] == "Trigger")

    overview: list[str] = []
    overview.append("# Apex API Touchpoint Overview (Custom Namespace)")
    overview.append("")
    overview.append(f"Generated: {now_utc}")
    overview.append("")
    overview.append("## Scope")
    overview.append("")
    overview.append("- Org total Apex classes: 19,970 (managed + custom).")
    overview.append("- Org total Apex triggers: 632 (managed + custom).")
    overview.append(f"- Investigated custom classes (`NamespacePrefix = null`): {class_count}")
    overview.append(f"- Investigated custom triggers (`NamespacePrefix = null`): {trigger_count}")
    overview.append("")
    overview.append("## Findings")
    overview.append("")
    overview.append(f"- Test classes detected: {test_class_count}")
    overview.append(f"- Artifacts with callout indicators: {len(callout_artifacts)}")
    overview.append(f"- REST-exposed classes (`@RestResource`): {len(rest_artifacts)}")
    overview.append(f"- Flow-invocable classes (`@InvocableMethod`): {len(invocable_artifacts)}")
    overview.append(f"- External-candidate touchpoints: {external_tp_count}")
    overview.append("")
    overview.append("## Top Ranked Artifacts")
    overview.append("")
    for i, r in enumerate(top_scores, start=1):
        overview.append(
            f"- {i}. `{r['artifact_type']} {r['name']}` (score {r['integration_score']}, "
            f"touchpoints {r['touchpoint_count']})"
        )
    overview.append("")
    overview.append("## Touchpoint Types")
    overview.append("")
    for tp_type, cnt in tp_type_counts.most_common():
        overview.append(f"- {tp_type}: {cnt}")
    overview.append("")
    overview.append("## Trigger Object Distribution")
    overview.append("")
    for obj, cnt in trigger_obj_counts.most_common():
        overview.append(f"- {obj}: {cnt}")
    overview.append("")
    overview.append("## Output Files")
    overview.append("")
    overview.append(f"- `{OUT_MAP.relative_to(ROOT)}`")
    overview.append(f"- `{OUT_TP.relative_to(ROOT)}`")
    overview.append(f"- `{OUT_RUNBOOK_CSV.relative_to(ROOT)}`")
    overview.append(f"- `{OUT_RUNBOOK_MD.relative_to(ROOT)}`")
    overview.append(f"- `{OUT_OVERVIEW_MD.relative_to(ROOT)}`")
    OUT_OVERVIEW_MD.write_text("\n".join(overview), encoding="utf-8")

    stats = {
        "generated_utc": now_utc,
        "scope": {
            "custom_classes": class_count,
            "custom_triggers": trigger_count,
        },
        "findings": {
            "test_classes": test_class_count,
            "artifacts_with_callout_indicators": len(callout_artifacts),
            "rest_exposed_classes": len(rest_artifacts),
            "invocable_classes": len(invocable_artifacts),
            "touchpoint_rows": len(touchpoint_rows),
            "external_candidate_touchpoint_rows": external_tp_count,
        },
        "top_ranked": [
            {
                "artifact_type": r["artifact_type"],
                "name": r["name"],
                "integration_score": int(r["integration_score"]),
            }
            for r in top_scores
        ],
    }
    OUT_STATS_JSON.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print(f"Wrote {OUT_MAP}")
    print(f"Wrote {OUT_TP}")
    print(f"Wrote {OUT_RUNBOOK_CSV}")
    print(f"Wrote {OUT_RUNBOOK_MD}")
    print(f"Wrote {OUT_OVERVIEW_MD}")
    print(f"Wrote {OUT_STATS_JSON}")


if __name__ == "__main__":
    main()
