#!/usr/bin/env python3
"""Manually run a byte-level release integrity report (no malware/signer claims)."""
import argparse
import json
import os
from pathlib import Path
import sys
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".github/scripts"))
from verify_release import verify_release_asset

parser = argparse.ArgumentParser()
parser.add_argument("--app-id", default="j-expense-tracker-my-expense-tracker",
                    help="Catalogue app ID or 'all' for every linked asset")
args = parser.parse_args()
catalog = json.loads((ROOT / "public/apps/catalog.json").read_text(encoding="utf-8"))
items = catalog["items"] if args.app_id == "all" else [i for i in catalog["items"] if i["id"] == args.app_id]
if not items:
    parser.error("App ID not found")

url = "https://api.github.com/repos/jebinc324/J-Digital-Hub/releases/tags/just24-public-v1"
headers = {"Accept": "application/vnd.github+json", "User-Agent": "JAppsIntegrityAudit/1.0"}
if os.getenv("GITHUB_TOKEN"):
    headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
with urlopen(Request(url, headers=headers), timeout=40) as response:
    release = json.load(response)
if release.get("tag_name") != "just24-public-v1":
    raise SystemExit("Unexpected release tag")
assets = {a["name"]: a for a in release.get("assets", [])}
results = []
errors = 0
for item in items:
    asset = assets.get(item["releaseAsset"])
    evidence = {"appId": item["id"], "filename": item["releaseAsset"], "status": "failed"}
    try:
        if not asset:
            raise ValueError("Release asset missing")
        expected = item["verifiedUpload"]
        sha = expected["sha256"]
        if (asset.get("digest") or "").lower() != "sha256:" + sha.lower():
            raise ValueError("Live release digest differs from catalogue")
        if asset.get("size") != expected["sizeBytes"]:
            raise ValueError("Live release size differs from catalogue")
        evidence.update(verify_release_asset(item["downloadUrl"], item["releaseAsset"],
                                             expected["sizeBytes"], sha))
        evidence["status"] = "integrity-check-passed"
        print("PASS", item["id"], item["releaseAsset"])
    except Exception as exc:
        errors += 1
        evidence["reason"] = str(exc)
        print("FAIL", item["id"], str(exc), file=sys.stderr)
    results.append(evidence)
report = {
    "purpose": "bytes, hashes and archive structure only; NOT antivirus/device/signature verification",
    "checked": len(results), "failed": errors, "assets": results,
}
(ROOT / "release_audit_report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("Release integrity report written; inspected", len(results), "assets")
sys.exit(1 if errors else 0)
