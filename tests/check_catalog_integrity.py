#!/usr/bin/env python3
"""Offline catalogue contract checks; metadata does not prove package safety."""
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "public/apps/catalog.json").read_text(encoding="utf-8"))
items = data["items"]
assert isinstance(items, list) and items, "Catalogue must have entries"
assert data["release"]["repository"] == "jebinc324/J-Digital-Hub"
assert data["release"]["tag"] == "just24-public-v1"
assert data["launch"]["listedProjects"] == len(items), "Stale catalogue total"
base = "https://github.com/jebinc324/J-Digital-Hub/releases/download/just24-public-v1/"
families = {"Android": (".apk",), "Revit Add-ins": (".zip",), "Revit Dynamo": (".zip", ".dyn")}
seen = set()
for item in items:
    name = item.get("id", "")
    assert isinstance(name, str) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name), name
    assert name not in seen, f"Duplicate item id: {name}"
    seen.add(name)
    family = item.get("family")
    assert family in families, (name, family)
    asset = item.get("releaseAsset", "")
    assert isinstance(asset, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", asset), name
    assert asset.lower().endswith(families[family]), (name, asset)
    assert item.get("access") == "public", name
    assert item.get("downloadUrl") == base + asset, f"Invalid/mismatched URL: {name}"
    upload = item.get("verifiedUpload") or {}
    assert upload.get("file") == asset, f"Release metadata mismatch: {name}"
    assert type(upload.get("sizeBytes")) is int and upload["sizeBytes"] > 0, name
    assert re.fullmatch(r"[a-fA-F0-9]{64}", upload.get("sha256", "")), name
    assert item.get("launchStatus") in (None, "uploaded-unverified"), \
        f"Never mark {name} verified without separate binary and device evidence"
    paths = [item.get("logo")] if item.get("logo") else []
    paths += item.get("screenshots") or []
    for media in paths:
        assert isinstance(media, str) and re.fullmatch(
            r"/assets/apps/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg)", media, re.I
        ), (name, media)
        assert (ROOT / "public" / media.lstrip("/")).is_file(), (name, media)
assert set(data["launch"].get("unverifiedBuilds", [])) <= seen
print(f"Catalogue validated: {len(items)} IDs, filenames, URLs, hashes and media paths")
