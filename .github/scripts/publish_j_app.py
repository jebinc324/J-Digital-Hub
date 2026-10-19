#!/usr/bin/env python3
"""Publish one J Apps item from a real GitHub Release APK/ZIP asset. Python stdlib only."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

REPO = "jebinc324/J-Digital-Hub"
TAG = "just24-public-v1"
FAMILIES = {
    "Android": ("Android app", ".apk"),
    "Revit Add-ins": ("Revit add-in", ".zip"),
    "Revit Dynamo": ("Dynamo script", ".zip"),
}
CATEGORIES = {
    "Engineering", "Automation", "Finance & Trading", "Productivity & Files",
    "Media & Creative", "Kids & Games", "Device & Safety", "Lifestyle",
}
MEDIA = re.compile(r"/assets/apps/[a-zA-Z0-9/_-]+\.(?:webp|png|jpg|jpeg)\Z", re.I)


def fail(reason):
    raise SystemExit("Publisher stopped: " + reason)


def existing_image(path, root):
    path = path.strip()
    if not path:
        return ""
    if not MEDIA.fullmatch(path) or "//" in path:
        fail("Media path must be /assets/apps/... and end in .webp/.png/.jpg.")
    full = (root / "public" / path.lstrip("/")).resolve()
    library = (root / "public/assets/apps").resolve()
    if not full.is_relative_to(library) or not full.is_file():
        fail("Upload image to the repository before publishing: " + path)
    return path


def get_release():
    url = f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}"
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "JAppsPublisher/1.0"}
    if os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    try:
        with urlopen(Request(url, headers=headers), timeout=30) as response:
            return json.load(response)
    except (HTTPError, URLError, TimeoutError) as exc:
        fail("Cannot verify GitHub Release: " + str(exc))


def update_visible_counts(root, old_count, items):
    total = len(items)
    pages = [root / "public/apps/index.html", root / "public/index.html"]
    result = {}
    ready = sum(
        item.get("downloadUrl") ==
        f"https://github.com/{REPO}/releases/download/{TAG}/{item.get('releaseAsset', '')}"
        for item in items if item.get("access") == "public"
    )
    for page in pages:
        html = page.read_text(encoding="utf-8")
        html, changes = re.subn(
            r"(?<![\w.])" + str(old_count) + r"(?![\w.])", str(total), html
        )
        if not changes:
            fail(f"Couldn't locate old project count on {page}")
        if page.parent.name == "apps":
            for family in ("all", *FAMILIES):
                amount = total if family == "all" else sum(
                    item.get("family") == family for item in items
                )
                pattern = (r'(<button[^>]*data-family="' + re.escape(family) +
                           r'"[^>]*>[^<]*<span>)\d+(</span>)')
                html, changes = re.subn(
                    pattern, lambda m: m.group(1) + str(amount) + m.group(2), html
                )
                if changes != 1:
                    fail(f"Cannot safely update {family} count on J Apps page")
            html = re.sub(
                r'(<strong id="j-ready-count">)\d+',
                lambda m: m.group(1) + str(ready), html
            )
            html = re.sub(
                r'(<strong id="j-pending-count">)\d+',
                lambda m: m.group(1) + str(total - ready), html
            )
            html = re.sub(
                r'(<span id="j-progress-label">)\d+ ready · \d+ pending',
                lambda m: m.group(1) + f"{ready} ready · {total-ready} pending", html
            )
        result[page] = html
    return result


def publish():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["update", "add", "remove"], required=True)
    parser.add_argument("--app-id", required=True)
    parser.add_argument("--apk-filename", required=True, help="Release file for add/update; REMOVE:<app-id> for removal")
    parser.add_argument("--version", default="")
    parser.add_argument("--name", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--family", default="Android", choices=FAMILIES)
    parser.add_argument("--category", default="")
    parser.add_argument("--logo-path", default="")
    parser.add_argument("--screenshots", default="")
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    app_id, filename = args.app_id.strip(), args.apk_filename.strip()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", app_id):
        fail("App ID must be lowercase-hyphenated, e.g. j-expense-tracker-my-expense-tracker")
    if args.mode != "remove" and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.(apk|zip)", filename, re.I):
        fail("Enter the exact APK/ZIP filename, without a path (or full URL)")
    version = args.version.strip()
    if version and not re.fullmatch(r"v?[0-9][0-9a-zA-Z.+_-]{0,39}", version):
        fail("Version should look like v3.2.16 or v1.0.0")
    category = args.category.strip()
    if category and category not in CATEGORIES:
        fail("Invalid category. Choose from: " + ", ".join(sorted(CATEGORIES)))
    catalog_file = root / "public/apps/catalog.json"
    catalog = json.loads(catalog_file.read_text(encoding="utf-8"))
    if catalog["release"]["repository"] != REPO or catalog["release"]["tag"] != TAG:
        fail("Unexpected GitHub Release configured in catalog.json")
    items = catalog["items"]
    found = [x for x in items if x.get("id") == app_id]
    if len(found) > 1:
        fail("Duplicate ID in catalogue")
    if args.mode == "remove":
        if not found:
            fail("Cannot remove: App ID not found in catalogue.")
        if filename != f"REMOVE:{app_id}":
            fail(f"Removal requires confirmation: enter REMOVE:{app_id} in the APK filename field.")
        if len(items) <= 1:
            fail("Refusing to remove the last app in the catalogue.")
        old_count = len(items)
        catalog["items"] = [item for item in items if item.get("id") != app_id]
        if isinstance(catalog.get("launch", {}).get("unverifiedBuilds"), list):
            catalog["launch"]["unverifiedBuilds"] = [
                item for item in catalog["launch"]["unverifiedBuilds"] if item != app_id
            ]
        catalog["launch"]["listedProjects"] = len(catalog["items"])
        catalog["launch"]["updatedAt"] = datetime.now(timezone.utc).date().isoformat()
        catalog["notice"] = catalog.get("notice", "").replace(
            f"all {old_count} project download files",
            f"all {len(catalog['items'])} project download files",
        )
        writes = {
            catalog_file: json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        }
        writes.update(update_visible_counts(root, old_count, catalog["items"]))
        for path, body in writes.items():
            path.write_text(body, encoding="utf-8")
        print(f"Removed website listing: {app_id}")
        print(f"Remaining apps: {len(catalog['items'])}")
        print("GitHub Release APK/ZIP is NOT deleted.")
        print("Changed files: " + ", ".join(str(path.relative_to(root)) for path in writes))
        return
    if args.mode == "update" and not found:
        fail("App ID not found. Check the spelling or choose mode=add.")
    if args.mode == "add" and found:
        fail("App already exists. Choose mode=update.")
    family = found[0]["family"] if found else args.family
    if family not in FAMILIES or not filename.lower().endswith(FAMILIES[family][1]):
        fail(f"{family} assets must end with {FAMILIES.get(family, ('', '.apk'))[1]}")
    if args.mode == "add" and (not args.name.strip() or not args.description.strip() or not version):
        fail("New apps require name, description and version.")
    if len(args.name) > 120 or len(args.description) > 1000:
        fail("Name or description is too long")
    logo = existing_image(args.logo_path, root)
    shots = []
    if args.screenshots.strip():
        paths = [x.strip() for x in args.screenshots.split(",")]
        if not 1 <= len(paths) <= 8:
            fail("Supply up to 8 comma-separated screenshots")
        shots = [existing_image(x, root) for x in paths]
        if not all(shots):
            fail("Screenshot paths must not be empty")

    release = get_release()
    if release.get("tag_name") != TAG:
        fail("Unexpected release tag")
    matches = [a for a in release.get("assets", []) if a.get("name") == filename]
    if len(matches) != 1:
        fail("Release asset not found; upload the exact filename to GitHub Release first: " + filename)
    asset = matches[0]
    url = f"https://github.com/{REPO}/releases/download/{TAG}/{filename}"
    digest = re.fullmatch(r"sha256:([a-fA-F0-9]{64})", asset.get("digest") or "")
    size = asset.get("size")
    if asset.get("browser_download_url") != url or type(size) is not int or size < 1 or not digest:
        fail("Release URL, size or SHA-256 not verified; refusing publication")

    if found:
        item = found[0]
        for key, val in (
            ("name", args.name.strip()), ("description", args.description.strip()),
            ("category", category), ("versionLabel", version)
        ):
            if val:
                item[key] = val
    else:
        item = {
            "id": app_id, "name": args.name.strip(), "family": family,
            "type": FAMILIES[family][0], "access": "public",
            "description": args.description.strip(), "versionLabel": version,
            "category": category or ("Engineering" if family != "Android" else "Productivity & Files"),
            "note": "Release uploaded; installation, signing and functionality are not independently verified.",
        }
        items.append(item)
    if logo:
        item["logo"] = logo
    if shots:
        item["screenshots"] = shots
    item.update({
        "uploadedFile": True, "releaseAsset": filename, "downloadUrl": url,
        "approxSizeMB": round(size / 1048576, 2),
        "verifiedUpload": {
            "file": filename, "sizeBytes": size, "sha256": digest.group(1).lower()
        },
        "launchStatus": "uploaded-unverified",
    })
    date = datetime.now(timezone.utc).date().isoformat()
    catalog["release"]["lastVerified"] = date
    catalog["launch"]["updatedAt"] = date
    catalog["launch"]["listedProjects"] = len(items)
    catalog["launch"]["currentReleaseAssets"] = len(release["assets"])
    if args.mode == "add":
        catalog["notice"] = catalog.get("notice", "").replace(
            f"all {len(items)-1} project download files",
            f"all {len(items)} project download files",
        )
    writes = {catalog_file: json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"}
    if args.mode == "add":
        writes.update(update_visible_counts(root, len(items) - 1, items))
    for path, body in writes.items():
        path.write_text(body, encoding="utf-8")
    print(f"Success: {args.mode} {app_id} -> {filename} ({size:,} bytes)")
    print(f"SHA-256 from GitHub: {digest.group(1).lower()}")
    print(f"Published catalogue entries: {len(items)}")
    print("Changed files: " + ", ".join(str(path.relative_to(root)) for path in writes))


if __name__ == "__main__":
    publish()
