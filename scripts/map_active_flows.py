from __future__ import annotations

import argparse
import csv
import json
import subprocess
import shutil
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape as xml_escape


ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
TARGET_ORG = "xeretec-sandfull01"
API_VERSION = "66.0"
SF_CLI = shutil.which("sf.cmd") or shutil.which("sf") or r"C:\Program Files\sf\bin\sf.cmd"


def run_sf_query(query: str) -> list[dict[str, Any]]:
    cmd = [
        SF_CLI,
        "data",
        "query",
        "--use-tooling-api",
        "--target-org",
        TARGET_ORG,
        "--query",
        query,
        "--json",
    ]
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    payload_raw = proc.stdout.strip() or proc.stderr.strip()
    if proc.returncode != 0:
        raise RuntimeError(f"SF query failed ({proc.returncode}): {payload_raw}")
    payload = json.loads(payload_raw)
    if payload.get("status") != 0:
        raise RuntimeError(f"SF query status error: {payload_raw}")
    return payload["result"]["records"]


def value_to_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    if not isinstance(value, dict):
        return ""

    for key in ("stringValue", "elementReference", "apexValue", "formulaExpression"):
        v = value.get(key)
        if v not in (None, ""):
            return str(v)
    for key in ("booleanValue", "numberValue", "dateValue", "dateTimeValue", "timeValue"):
        v = value.get(key)
        if v is not None:
            return str(v)
    return ""


def process_metadata_map(metadata: dict[str, Any]) -> dict[str, str]:
    out: dict[str, str] = {}
    for item in metadata.get("processMetadataValues") or []:
        name = item.get("name")
        if not name:
            continue
        out[name] = value_to_text(item.get("value"))
    return out


def extract_entry_criteria(metadata: dict[str, Any]) -> str:
    start = metadata.get("start")
    if isinstance(start, dict):
        filters = start.get("filters") or []
        parts: list[str] = []
        for f in filters:
            left = f.get("field") or f.get("leftValueReference") or ""
            op = f.get("operator") or ""
            right = value_to_text(f.get("value") or f.get("rightValue"))
            if not right:
                right = str(f.get("valueLiteral") or "")
            cond = " ".join(x for x in [left, op, right] if x)
            if cond:
                parts.append(cond)
        logic = start.get("filterLogic")
        if logic and parts:
            return f"logic={logic}; " + "; ".join(parts[:8])
        if parts:
            return "; ".join(parts[:8])

    # Fallback for Process Builder style flows where conditions sit in first decision.
    decisions = metadata.get("decisions") or []
    if decisions:
        d0 = decisions[0]
        parts = []
        for rule in (d0.get("rules") or [])[:2]:
            for cond in (rule.get("conditions") or [])[:4]:
                left = cond.get("leftValueReference") or ""
                op = cond.get("operator") or ""
                right = value_to_text(cond.get("rightValue") or cond.get("value"))
                c = " ".join(x for x in [left, op, right] if x)
                if c:
                    parts.append(c)
        if parts:
            return "; ".join(parts[:8])

    return ""


def extract_trigger_object(metadata: dict[str, Any], meta_map: dict[str, str]) -> str:
    trigger_object = meta_map.get("ObjectType", "")
    if trigger_object:
        return trigger_object

    start = metadata.get("start")
    if isinstance(start, dict):
        trigger_object = str(start.get("object") or start.get("objectType") or "")
        if trigger_object:
            return trigger_object

    for var in metadata.get("variables") or []:
        if var.get("name") in {"myVariable_current", "$Record"} and var.get("objectType"):
            return str(var["objectType"])
    for var in metadata.get("variables") or []:
        if var.get("isInput") and var.get("dataType") == "SObject" and var.get("objectType"):
            return str(var["objectType"])
    return ""


def extract_trigger_type(metadata: dict[str, Any], meta_map: dict[str, str]) -> str:
    trigger_type = meta_map.get("TriggerType", "")
    if trigger_type:
        return trigger_type

    start = metadata.get("start")
    if isinstance(start, dict):
        for key in ("triggerType", "recordTriggerType", "scheduleType"):
            if start.get(key):
                return str(start.get(key))
    return ""


def build_touchpoints(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    touchpoints: list[dict[str, Any]] = []
    keywords = (
        "http",
        "callout",
        "api",
        "endpoint",
        "integration",
        "webhook",
        "publish",
        "message",
        "messaging",
        "rest",
        "soap",
        "sync",
        "outbound",
    )

    def is_external(detail: str, kind: str) -> bool:
        lowered = detail.lower()
        return kind.lower() in {"apex", "apexplugin", "externalservice"} or any(
            k in lowered for k in keywords
        )

    for ac in metadata.get("actionCalls") or []:
        action_type = str(ac.get("actionType") or "unknown")
        action_name = str(ac.get("actionName") or ac.get("nameSegment") or ac.get("name") or "")
        label = str(ac.get("label") or "")
        detail = action_name
        if label and label != action_name:
            detail = f"{action_name} [{label}]".strip()
        if not detail:
            detail = label or "(unnamed action)"
        touchpoints.append(
            {
                "touchpoint_type": f"Action:{action_type}",
                "touchpoint_name": action_name or label or "(unnamed)",
                "touchpoint_detail": detail,
                "external_candidate": is_external(detail, action_type),
            }
        )

    for ap in metadata.get("apexPluginCalls") or []:
        name = str(ap.get("apexClass") or ap.get("name") or ap.get("label") or "(unnamed)")
        detail = name
        touchpoints.append(
            {
                "touchpoint_type": "ApexPlugin",
                "touchpoint_name": name,
                "touchpoint_detail": detail,
                "external_candidate": True,
            }
        )

    for sf in metadata.get("subflows") or []:
        name = str(sf.get("flowName") or sf.get("name") or sf.get("label") or "(unnamed subflow)")
        touchpoints.append(
            {
                "touchpoint_type": "Subflow",
                "touchpoint_name": name,
                "touchpoint_detail": name,
                "external_candidate": is_external(name, "subflow"),
            }
        )

    for rc in metadata.get("recordCreates") or []:
        obj = str(rc.get("object") or rc.get("objectType") or "")
        if obj.endswith("__e"):
            touchpoints.append(
                {
                    "touchpoint_type": "PlatformEventPublish",
                    "touchpoint_name": obj,
                    "touchpoint_detail": obj,
                    "external_candidate": True,
                }
            )

    return touchpoints


def write_package_xml(flow_names: list[str], api_version: str) -> Path:
    package_path = CONFIG_DIR / "flow-active-package.xml"
    members = "\n".join([f"        <members>{xml_escape(name)}</members>" for name in flow_names])
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n'
        "    <types>\n"
        f"{members}\n"
        "        <name>Flow</name>\n"
        "    </types>\n"
        f"    <version>{xml_escape(api_version)}</version>\n"
        "</Package>\n"
    )
    package_path.write_text(xml, encoding="utf-8")
    return package_path


def main() -> None:
    global TARGET_ORG
    global API_VERSION

    parser = argparse.ArgumentParser(description="Map active Salesforce Flow metadata.")
    parser.add_argument("--target-org", default=TARGET_ORG, help="Salesforce org alias or username.")
    parser.add_argument("--api-version", default=API_VERSION, help="API version used in generated package.xml.")
    args = parser.parse_args()

    TARGET_ORG = args.target_org
    API_VERSION = args.api_version

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Querying active flow list from target org: {TARGET_ORG}")
    active_flows = run_sf_query(
        "SELECT Id, Definition.DeveloperName, ProcessType, Status, VersionNumber "
        "FROM Flow WHERE Status = 'Active' ORDER BY Definition.DeveloperName"
    )
    if not active_flows:
        raise RuntimeError("No active flows found.")
    print(f"Found {len(active_flows)} active flow versions.")

    summary_rows: list[dict[str, Any]] = []
    touchpoint_rows: list[dict[str, Any]] = []

    for idx, flow in enumerate(active_flows, start=1):
        flow_id = flow["Id"]
        detail = run_sf_query(
            "SELECT Id, Definition.DeveloperName, ProcessType, Status, VersionNumber, Metadata "
            f"FROM Flow WHERE Id = '{flow_id}'"
        )
        if not detail:
            continue
        rec = detail[0]
        metadata = rec.get("Metadata") or {}
        dev_name = rec.get("Definition", {}).get("DeveloperName") or "(unknown)"
        process_type = rec.get("ProcessType") or ""
        version = rec.get("VersionNumber") or ""

        pmeta = process_metadata_map(metadata)
        trigger_object = extract_trigger_object(metadata, pmeta)
        trigger_type = extract_trigger_type(metadata, pmeta)
        entry_criteria = extract_entry_criteria(metadata)

        touchpoints = build_touchpoints(metadata)
        for tp in touchpoints:
            touchpoint_rows.append(
                {
                    "flow_developer_name": dev_name,
                    "flow_id": flow_id,
                    "version_number": version,
                    "process_type": process_type,
                    **tp,
                }
            )

        summary_rows.append(
            {
                "flow_developer_name": dev_name,
                "flow_id": flow_id,
                "version_number": version,
                "process_type": process_type,
                "trigger_object": trigger_object,
                "trigger_type": trigger_type,
                "entry_criteria_present": "Y" if entry_criteria else "N",
                "entry_criteria_summary": entry_criteria,
                "action_call_count": len(metadata.get("actionCalls") or []),
                "apex_plugin_call_count": len(metadata.get("apexPluginCalls") or []),
                "subflow_count": len(metadata.get("subflows") or []),
                "touchpoint_count": len(touchpoints),
                "external_candidate_touchpoint_count": sum(
                    1 for tp in touchpoints if tp["external_candidate"]
                ),
            }
        )

        if idx % 20 == 0 or idx == len(active_flows):
            print(f"Processed {idx}/{len(active_flows)} flows...")

    summary_path = CONFIG_DIR / "flow-active-map.csv"
    touchpoints_path = CONFIG_DIR / "flow-active-touchpoints.csv"
    external_only_path = CONFIG_DIR / "flow-active-external-touchpoints.csv"

    summary_fields = [
        "flow_developer_name",
        "flow_id",
        "version_number",
        "process_type",
        "trigger_object",
        "trigger_type",
        "entry_criteria_present",
        "entry_criteria_summary",
        "action_call_count",
        "apex_plugin_call_count",
        "subflow_count",
        "touchpoint_count",
        "external_candidate_touchpoint_count",
    ]
    with summary_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=summary_fields)
        writer.writeheader()
        writer.writerows(summary_rows)

    touchpoint_fields = [
        "flow_developer_name",
        "flow_id",
        "version_number",
        "process_type",
        "touchpoint_type",
        "touchpoint_name",
        "touchpoint_detail",
        "external_candidate",
    ]
    with touchpoints_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=touchpoint_fields)
        writer.writeheader()
        writer.writerows(touchpoint_rows)

    external_rows = [r for r in touchpoint_rows if r["external_candidate"]]
    with external_only_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=touchpoint_fields)
        writer.writeheader()
        writer.writerows(external_rows)

    package_xml = write_package_xml(
        sorted({r["flow_developer_name"] for r in summary_rows}),
        api_version=API_VERSION,
    )

    stats = {
        "active_flow_count": len(summary_rows),
        "flows_with_touchpoints": sum(1 for r in summary_rows if int(r["touchpoint_count"]) > 0),
        "flows_with_external_candidates": sum(
            1 for r in summary_rows if int(r["external_candidate_touchpoint_count"]) > 0
        ),
        "touchpoint_row_count": len(touchpoint_rows),
        "external_touchpoint_row_count": len(external_rows),
        "output_files": [
            str(summary_path.relative_to(ROOT)),
            str(touchpoints_path.relative_to(ROOT)),
            str(external_only_path.relative_to(ROOT)),
            str(package_xml.relative_to(ROOT)),
        ],
    }
    stats_path = CONFIG_DIR / "flow-active-map-stats.json"
    stats_path.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print(f"Wrote {summary_path}")
    print(f"Wrote {touchpoints_path}")
    print(f"Wrote {external_only_path}")
    print(f"Wrote {package_xml}")
    print(f"Wrote {stats_path}")


if __name__ == "__main__":
    main()
