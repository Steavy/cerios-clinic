#!/usr/bin/env python3
"""Render a static HTML index of CodeQL/Semgrep/Gitleaks SARIF findings.

Usage: sarif-to-html.py <sarif-dir> <out-dir>
Reads every *.sarif file in <sarif-dir> and writes an index.html plus a
copy of the raw SARIF files under out-dir/raw/.
"""

import glob
import html
import json
import os
import sys
import time

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4, "unknown": 5}


def sarif_level(level: str) -> str:
    if level == "error":
        return "high"
    if level == "warning":
        return "medium"
    if level == "note":
        return "low"
    return "info"


def tool_name(run: dict) -> str:
    driver = run.get("tool", {}).get("driver", {})
    name = driver.get("name") or driver.get("fullName") or "unknown"
    return name.split(" ")[0] if name else "unknown"


def rule_lookup(run: dict) -> dict:
    rules = {}
    for rule in run.get("tool", {}).get("driver", {}).get("rules", []):
        rid = rule.get("id") or rule.get("name")
        if not rid:
            continue
        short = rule.get("shortDescription", {}).get("text", "")
        full = rule.get("fullDescription", {}).get("text", "")
        rules[rid] = {"short": short, "full": full}
    return rules


def location_of(result: dict) -> str:
    locs = result.get("locations", [])
    if not locs:
        return ""
    phys = locs[0].get("physicalLocation", {})
    artifact = phys.get("artifactLocation", {})
    uri = artifact.get("uri", "")
    region = phys.get("region", {})
    line = region.get("startLine")
    if line is not None:
        col = region.get("startColumn")
        return f"{uri}:{line}" + (f":{col}" if col is not None else "")
    return uri


def parse_sarif(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    findings = []
    for run in data.get("runs", []):
        name = tool_name(run)
        rules = rule_lookup(run)
        for result in run.get("results", []):
            rid = result.get("ruleId") or "unknown"
            rule = rules.get(rid, {})
            message = result.get("message", {}).get("text", "")
            if not message:
                message = rule.get("short", "") or rule.get("full", "")
            findings.append(
                {
                    "tool": name,
                    "rule": rid,
                    "message": message,
                    "severity": sarif_level(result.get("level", "note")),
                    "location": location_of(result),
                }
            )
    return findings


def render(findings: list[dict], out_dir: str, generated: str) -> None:
    by_tool: dict[str, list[dict]] = {}
    for f in findings:
        by_tool.setdefault(f["tool"], []).append(f)

    counts: dict[str, int] = {"high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1

    badge = {
        "high": '<span class="sev sev-high">high</span>',
        "medium": '<span class="sev sev-medium">medium</span>',
        "low": '<span class="sev sev-low">low</span>',
        "info": '<span class="sev sev-info">info</span>',
    }

    def tool_section(tool: str, items: list[dict]) -> str:
        items = sorted(items, key=lambda i: SEVERITY_ORDER.get(i["severity"], 5))
        rows = "\n".join(
            (
                "<tr>"
                f"<td>{badge.get(i['severity'], i['severity'])}</td>"
                f"<td><code>{html.escape(i['rule'])}</code></td>"
                f"<td><code>{html.escape(i['location'])}</code></td>"
                f"<td>{html.escape(i['message'][:300])}</td>"
                "</tr>"
            )
            for i in items
        )
        return (
            f"<h2>{html.escape(tool)} <span class='count'>({len(items)})</span></h2>\n"
            "<table>\n<thead><tr><th>Severity</th><th>Rule</th><th>Location</th><th>Message</th></tr></thead>\n"
            f"<tbody>\n{rows}\n</tbody>\n</table>"
        )

    summaries = " ".join(f"{sev}: <b>{counts.get(sev, 0)}</b>" for sev in ("high", "medium", "low", "info"))

    sections = "\n".join(tool_section(t, items) for t, items in sorted(by_tool.items()))

    index_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAST findings — cerios-clinic</title>
<style>
  body {{ font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 72rem; padding: 0 1rem; }}
  h1 {{ margin-bottom: .25rem; }}
  .meta {{ color: #555; font-size: .9rem; }}
  table {{ border-collapse: collapse; width: 100%; margin-bottom: 2rem; }}
  th, td {{ border: 1px solid #ddd; padding: .4rem .6rem; text-align: left; vertical-align: top; }}
  th {{ background: #f4f4f4; }}
  code {{ word-break: break-all; }}
  .sev {{ padding: .1rem .45rem; border-radius: 3px; color: #fff; font-size: .8rem; white-space: nowrap; }}
  .sev-high {{ background: #d73a49; }}
  .sev-medium {{ background: #e36209; }}
  .sev-low {{ background: #735c0f; }}
  .sev-info {{ background: #57606a; }}
  .count {{ color: #888; font-weight: normal; }}
</style>
</head>
<body>
<h1>SAST findings</h1>
<div class="meta">Generated {generated} UTC &mdash; <a href="raw/">raw SARIF files</a></div>
<p>{summaries} &mdash; total: <b>{len(findings)}</b></p>
{sections}
</body>
</html>"""

    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html)


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    sarif_dir, out_dir = sys.argv[1], sys.argv[2]
    files = sorted(glob.glob(os.path.join(sarif_dir, "**", "*.sarif"), recursive=True))
    findings = []
    for path in files:
        try:
            findings.extend(parse_sarif(path))
        except Exception as exc:
            print(f"warning: could not parse {path}: {exc}")

    os.makedirs(out_dir, exist_ok=True)
    raw_dir = os.path.join(out_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    for path in files:
        os.system(f"cp '{path}' '{raw_dir}/'")

    generated = time.strftime("%Y-%m-%d %H:%M", time.gmtime())
    render(findings, out_dir, generated)

    print(f"Rendered {len(findings)} findings from {len(files)} SARIF file(s) to {out_dir}/index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
