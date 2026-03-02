from __future__ import annotations

import argparse
import csv
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
FLOW_XML_DIR = CONFIG_DIR / "flow-metadata-active" / "flows"

MAP_CSV = CONFIG_DIR / "flow-active-map.csv"
EXTERNAL_TP_CSV = CONFIG_DIR / "flow-active-external-touchpoints.csv"
ALL_TP_CSV = CONFIG_DIR / "flow-active-touchpoints.csv"

OUT_MARKDOWN = CONFIG_DIR / "flow-runbook-top20.md"
OUT_CSV = CONFIG_DIR / "flow-runbook-top20.csv"

NS = {"m": "http://soap.sforce.com/2006/04/metadata"}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def text(elem: ET.Element | None, path: str) -> str:
    if elem is None:
        return ""
    node = elem.find(path, NS)
    if node is None or node.text is None:
        return ""
    return node.text.strip()


def parse_value(value_elem: ET.Element | None) -> str:
    if value_elem is None:
        return ""
    tags = [
        "stringValue",
        "elementReference",
        "booleanValue",
        "numberValue",
        "dateValue",
        "dateTimeValue",
        "timeValue",
        "formulaExpression",
    ]
    for tag in tags:
        node = value_elem.find(f"m:{tag}", NS)
        if node is not None and node.text is not None:
            return node.text.strip()
    # fallback
    for child in value_elem:
        if child.text:
            return child.text.strip()
    return ""


def cond_to_str(cond: ET.Element) -> str:
    left = text(cond, "m:leftValueReference") or text(cond, "m:field")
    op = text(cond, "m:operator")
    right = parse_value(cond.find("m:rightValue", NS)) or parse_value(cond.find("m:value", NS))
    if not right:
        right = text(cond, "m:rightValueField")
    if not right:
        right = text(cond, "m:valueLiteral")
    parts = [p for p in [left, op, right] if p]
    return " ".join(parts).strip()


def parse_flow_xml(flow_name: str) -> dict[str, Any]:
    xml_path = FLOW_XML_DIR / f"{flow_name}.flow-meta.xml"
    if not xml_path.exists():
        return {
            "exists": False,
            "flow_name": flow_name,
            "trigger_object": "",
            "trigger_type": "",
            "entry_criteria": "",
            "decision_summaries": [],
            "record_lookups": [],
            "record_creates": [],
            "record_updates": [],
            "record_deletes": [],
            "action_calls": [],
            "subflows": [],
            "apex_plugins": [],
            "output_objects": [],
        }

    root = ET.parse(xml_path).getroot()
    pmeta: dict[str, str] = {}
    for pm in root.findall("m:processMetadataValues", NS):
        name = text(pm, "m:name")
        if not name:
            continue
        pmeta[name] = parse_value(pm.find("m:value", NS))

    start = root.find("m:start", NS)
    trigger_object = text(start, "m:object") if start is not None else ""
    if not trigger_object:
        trigger_object = pmeta.get("ObjectType", "")

    trigger_type = text(start, "m:triggerType") if start is not None else ""
    if not trigger_type:
        trigger_type = text(start, "m:recordTriggerType") if start is not None else ""
    if not trigger_type:
        trigger_type = pmeta.get("TriggerType", "")

    entry_criteria = ""
    if start is not None:
        filters = start.findall("m:filters", NS)
        logic = text(start, "m:filterLogic")
        conds = [cond_to_str(f) for f in filters if cond_to_str(f)]
        if conds:
            if logic:
                entry_criteria = f"({logic}) " + "; ".join(conds[:8])
            else:
                entry_criteria = "; ".join(conds[:8])

    decision_summaries: list[str] = []
    for d in root.findall("m:decisions", NS):
        d_label = text(d, "m:label") or text(d, "m:name")
        rules = d.findall("m:rules", NS)
        rule_parts: list[str] = []
        for r in rules[:3]:
            r_label = text(r, "m:label") or text(r, "m:name")
            r_logic = text(r, "m:conditionLogic")
            r_conds = [cond_to_str(c) for c in r.findall("m:conditions", NS)]
            r_conds = [c for c in r_conds if c][:4]
            if r_conds:
                if r_logic:
                    rule_parts.append(f"{r_label}: ({r_logic}) " + " | ".join(r_conds))
                else:
                    rule_parts.append(f"{r_label}: " + " | ".join(r_conds))
            else:
                rule_parts.append(r_label)
        if rule_parts:
            decision_summaries.append(f"{d_label} -> " + " || ".join(rule_parts))
        else:
            decision_summaries.append(d_label)

    def parse_records(tag: str) -> list[dict[str, str]]:
        rows = []
        for node in root.findall(f"m:{tag}", NS):
            rows.append(
                {
                    "name": text(node, "m:name") or text(node, "m:label") or f"({tag})",
                    "label": text(node, "m:label"),
                    "object": text(node, "m:object"),
                }
            )
        return rows

    record_lookups = parse_records("recordLookups")
    record_creates = parse_records("recordCreates")
    record_updates = parse_records("recordUpdates")
    record_deletes = parse_records("recordDeletes")

    action_calls: list[dict[str, str]] = []
    for ac in root.findall("m:actionCalls", NS):
        action_name = text(ac, "m:actionName")
        action_type = text(ac, "m:actionType")
        label = text(ac, "m:label") or text(ac, "m:name")
        publication_identifier = ""
        important_inputs: list[str] = []
        for ip in ac.findall("m:inputParameters", NS):
            pname = text(ip, "m:name")
            pval = parse_value(ip.find("m:value", NS))
            if pname and pval:
                if pname == "publicationIdentifier":
                    publication_identifier = pval
                if pname in {"publicationIdentifier", "recordId", "endpoint", "url"}:
                    important_inputs.append(f"{pname}={pval}")
        action_calls.append(
            {
                "name": action_name,
                "type": action_type,
                "label": label,
                "publication_identifier": publication_identifier,
                "inputs": "; ".join(important_inputs),
            }
        )

    subflows = [
        {
            "name": text(sf, "m:flowName") or text(sf, "m:name"),
            "label": text(sf, "m:label"),
        }
        for sf in root.findall("m:subflows", NS)
    ]

    apex_plugins = [
        {
            "name": text(ap, "m:apexClass") or text(ap, "m:name"),
            "label": text(ap, "m:label"),
        }
        for ap in root.findall("m:apexPluginCalls", NS)
    ]

    output_objects = sorted(
        {
            r["object"]
            for r in (record_creates + record_updates + record_deletes)
            if r.get("object")
        }
    )

    return {
        "exists": True,
        "flow_name": flow_name,
        "trigger_object": trigger_object,
        "trigger_type": trigger_type,
        "entry_criteria": entry_criteria,
        "decision_summaries": decision_summaries,
        "record_lookups": record_lookups,
        "record_creates": record_creates,
        "record_updates": record_updates,
        "record_deletes": record_deletes,
        "action_calls": action_calls,
        "subflows": subflows,
        "apex_plugins": apex_plugins,
        "output_objects": output_objects,
    }


def score_flow(row: dict[str, str]) -> int:
    trigger_object = row.get("trigger_object", "")
    name = row.get("flow_developer_name", "").lower()
    ext = int(row.get("external_candidate_touchpoint_count", "0") or 0)
    touch = int(row.get("touchpoint_count", "0") or 0)
    has_entry = 1 if row.get("entry_criteria_present") == "Y" else 0

    object_bonus_map = {
        "Opportunity": 30,
        "SCMC__Sales_Order__c": 30,
        "SCMC__Sales_Order_Line_Item__c": 30,
        "SCMC__Invoicing__c": 30,
        "SCMC__Purchase_Order__c": 20,
        "SCMC__Purchase_Order_Line_Item__c": 20,
        "OpportunityLineItem": 20,
        "Account": 15,
        "Contact": 10,
        "MACD__c": 10,
        "MACD_Line_Item__c": 10,
        "c2g__codaInvoice__c": 20,
        "c2g__codaCreditNote__c": 20,
    }
    object_bonus = object_bonus_map.get(trigger_object, 0)

    kw = [
        "invoice",
        "sales_order",
        "purchase_order",
        "commission",
        "opp",
        "opportunity",
        "macd",
        "vat",
        "approval",
        "billing",
    ]
    keyword_bonus = min(30, sum(3 for k in kw if k in name))

    return ext * 100 + touch * 10 + object_bonus + keyword_bonus + has_entry


def external_summary(
    flow_info: dict[str, Any],
    external_tp_counts: Counter[str],
    touchpoint_map: dict[str, list[dict[str, str]]],
) -> str:
    count = external_tp_counts.get(flow_info["flow_name"], 0)
    if count <= 0:
        return "No clear external/API touchpoint detected in metadata."

    action_details = []
    for ac in flow_info["action_calls"]:
        name = ac.get("name", "")
        label = ac.get("label", "")
        ppub = ac.get("publication_identifier", "")
        piece = name or label or "action"
        if ppub:
            piece += f" [publication={ppub}]"
        action_details.append(piece)

    if action_details:
        preview = "; ".join(action_details[:3])
        return f"Potential external/API touchpoints detected ({count}): {preview}."

    fallback = touchpoint_map.get(flow_info["flow_name"], [])
    if fallback:
        preview = "; ".join([f"{tp.get('touchpoint_type','')}:{tp.get('touchpoint_name','')}" for tp in fallback[:3]])
        return f"Potential external/API touchpoints detected ({count}): {preview}."

    return f"Potential external/API touchpoints detected ({count})."


def trim(s: str, n: int = 220) -> str:
    if len(s) <= n:
        return s
    return s[: n - 3] + "..."


def record_items(items: list[dict[str, str]]) -> str:
    if not items:
        return "None"
    parts = []
    for item in items[:6]:
        obj = item.get("object", "")
        name = item.get("label") or item.get("name") or ""
        if obj and name:
            parts.append(f"{obj} ({name})")
        elif obj:
            parts.append(obj)
        elif name:
            parts.append(name)
    if not parts:
        return "None"
    return "; ".join(parts)


def action_items(actions: list[dict[str, str]], fallback_touchpoints: list[dict[str, str]] | None = None) -> str:
    if not actions:
        if not fallback_touchpoints:
            return "None"
        vals = []
        for tp in fallback_touchpoints[:8]:
            ttype = tp.get("touchpoint_type", "")
            tname = tp.get("touchpoint_name", "")
            tdetail = tp.get("touchpoint_detail", "")
            if tdetail and tdetail != tname:
                vals.append(f"{ttype}:{tname} ({tdetail})")
            else:
                vals.append(f"{ttype}:{tname}")
        return "; ".join(vals) if vals else "None"
    out = []
    for ac in actions[:8]:
        name = ac.get("name", "")
        label = ac.get("label", "")
        atype = ac.get("type", "")
        pub = ac.get("publication_identifier", "")
        item = f"{atype}:{name}" if atype or name else "action"
        if label and label != name:
            item += f" ({label})"
        if pub:
            item += f" [publication={pub}]"
        out.append(item)
    return "; ".join(out) if out else "None"


def build_effect_summary(flow_info: dict[str, Any]) -> str:
    trig_obj = flow_info.get("trigger_object") or "an internal event"
    trig_type = flow_info.get("trigger_type") or "an automation context"
    writes = flow_info.get("output_objects") or []
    reads = [r.get("object") for r in flow_info.get("record_lookups", []) if r.get("object")]

    segments = [f"Runs on {trig_obj} ({trig_type})."]
    if writes:
        segments.append("Writes data to " + ", ".join(writes[:6]) + ".")
    elif flow_info.get("record_updates") or flow_info.get("record_creates") or flow_info.get("record_deletes"):
        segments.append("Performs record writes (object unresolved in metadata extract).")
    else:
        segments.append("Does not show direct record-write elements.")

    if reads:
        segments.append("Reads from " + ", ".join(sorted(set(reads))[:6]) + ".")

    if flow_info.get("action_calls"):
        segments.append("Invokes action calls for downstream processing.")
    if flow_info.get("subflows"):
        segments.append("Chains into subflows.")
    return " ".join(segments)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate plain-English flow runbook from active flow map."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Number of flows to include. Use 0 (or negative) for all flows.",
    )
    parser.add_argument(
        "--output-prefix",
        default="flow-runbook-top20",
        help="Output filename prefix under config/ (without extension).",
    )
    parser.add_argument(
        "--title",
        default="Top 20 Active Flow Runbook (System Behavior)",
        help="Markdown document title.",
    )
    args = parser.parse_args()

    out_markdown = CONFIG_DIR / f"{args.output_prefix}.md"
    out_csv = CONFIG_DIR / f"{args.output_prefix}.csv"

    rows = read_csv(MAP_CSV)
    ext_rows = read_csv(EXTERNAL_TP_CSV)
    all_tp_rows = read_csv(ALL_TP_CSV)
    external_tp_counts = Counter(r["flow_developer_name"] for r in ext_rows)
    touchpoint_map: dict[str, list[dict[str, str]]] = {}
    for r in all_tp_rows:
        touchpoint_map.setdefault(r["flow_developer_name"], []).append(r)

    for r in rows:
        r["score"] = str(score_flow(r))

    sorted_rows = sorted(
        rows,
        key=lambda r: (
            int(r["score"]),
            int(r.get("external_candidate_touchpoint_count", "0") or 0),
            int(r.get("touchpoint_count", "0") or 0),
            r.get("flow_developer_name", ""),
        ),
        reverse=True,
    )

    if args.limit <= 0:
        selected = sorted_rows
    else:
        selected = sorted_rows[: args.limit]
    flow_infos = [parse_flow_xml(r["flow_developer_name"]) for r in selected]

    # CSV output
    csv_rows: list[dict[str, str]] = []
    for row, info in zip(selected, flow_infos):
        csv_rows.append(
            {
                "rank": str(len(csv_rows) + 1),
                "flow_developer_name": row["flow_developer_name"],
                "score": row["score"],
                "process_type": row.get("process_type", ""),
                "version_number": row.get("version_number", ""),
                "trigger_object": info.get("trigger_object", "") or row.get("trigger_object", ""),
                "trigger_type": info.get("trigger_type", "") or row.get("trigger_type", ""),
                "entry_criteria_summary": trim(info.get("entry_criteria", "") or row.get("entry_criteria_summary", ""), 260),
                "decision_count": str(len(info.get("decision_summaries", []))),
                "action_call_count": str(len(info.get("action_calls", []))),
                "record_create_count": str(len(info.get("record_creates", []))),
                "record_update_count": str(len(info.get("record_updates", []))),
                "record_delete_count": str(len(info.get("record_deletes", []))),
                "record_lookup_count": str(len(info.get("record_lookups", []))),
                "external_candidate_touchpoint_count": str(
                    external_tp_counts.get(row["flow_developer_name"], 0)
                ),
            }
        )

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "rank",
                "flow_developer_name",
                "score",
                "process_type",
                "version_number",
                "trigger_object",
                "trigger_type",
                "entry_criteria_summary",
                "decision_count",
                "action_call_count",
                "record_create_count",
                "record_update_count",
                "record_delete_count",
                "record_lookup_count",
                "external_candidate_touchpoint_count",
            ],
        )
        writer.writeheader()
        writer.writerows(csv_rows)

    # Markdown output
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    md: list[str] = []
    md.append(f"# {args.title}")
    md.append("")
    md.append(f"Generated: {now_utc}")
    md.append("Source org alias: xeretec-sandfull01")
    md.append("Selection method: highest integration/system impact score from active flow map.")
    md.append("")
    md.append("Score factors: external touchpoint count, touchpoint count, trigger-object business criticality,")
    md.append("flow-name business keywords, and presence of entry criteria.")
    md.append("")
    md.append("## Ranked List")
    md.append("")
    for row in csv_rows:
        md.append(
            f"- {row['rank']}. `{row['flow_developer_name']}` (score {row['score']}, "
            f"trigger `{row['trigger_object']}` / `{row['trigger_type']}`)"
        )
    md.append("")

    for idx, (row, info) in enumerate(zip(selected, flow_infos), start=1):
        flow_name = row["flow_developer_name"]
        trigger_object = info.get("trigger_object") or row.get("trigger_object", "")
        trigger_type = info.get("trigger_type") or row.get("trigger_type", "")
        entry = info.get("entry_criteria") or row.get("entry_criteria_summary", "") or "None detected"
        decisions = info.get("decision_summaries", [])

        md.append(f"## {idx}. {flow_name}")
        md.append("")
        md.append(
            f"- Run context: process `{row.get('process_type','')}`, version `{row.get('version_number','')}`"
        )
        md.append(f"- Trigger: `{trigger_object or '(not explicit)'}` / `{trigger_type or '(not explicit)'}`")
        md.append(f"- Entry criteria: {trim(entry, 420)}")
        md.append(f"- In-system effect summary: {build_effect_summary(info)}")
        md.append(f"- Data reads: {record_items(info.get('record_lookups', []))}")
        md.append(
            "- Data writes: "
            + f"creates[{record_items(info.get('record_creates', []))}] "
            + f"updates[{record_items(info.get('record_updates', []))}] "
            + f"deletes[{record_items(info.get('record_deletes', []))}]"
        )
        md.append(
            f"- Action calls: {action_items(info.get('action_calls', []), touchpoint_map.get(flow_name, []))}"
        )
        subflows = info.get("subflows", [])
        if subflows:
            subflow_list = "; ".join(
                [sf.get("name") or sf.get("label") or "(subflow)" for sf in subflows[:8]]
            )
            md.append(f"- Subflows: {subflow_list}")
        else:
            md.append("- Subflows: None")
        md.append(
            f"- External/API note: {external_summary(info, external_tp_counts, touchpoint_map)}"
        )

        if decisions:
            md.append("- Branch logic:")
            for d in decisions[:4]:
                md.append(f"  - {trim(d, 460)}")
        else:
            md.append("- Branch logic: no explicit decision nodes detected.")
        md.append("")

    out_markdown.write_text("\n".join(md), encoding="utf-8")

    print(f"Wrote {out_markdown}")
    print(f"Wrote {out_csv}")


if __name__ == "__main__":
    main()
