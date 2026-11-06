"""Independently stream and hash public GitHub release assets; archive hygiene only.

A successful check is NOT malware scanning, signing verification or device testing.
"""
import hashlib
from datetime import datetime, timezone
import tempfile
import zipfile
from urllib.request import Request, urlopen

MAX_DOWNLOAD = 1024 * 1024 * 1024
MAX_ENTRIES = 20000
MAX_UNPACKED = 2 * 1024 * 1024 * 1024
SECRET_SUFFIXES = (".jks", ".keystore", ".p12", ".pfx", ".key")


def inspect_archive(stream, filename):
    """Validate ZIP/APK structure without extracting or executing any content."""
    archive_required = filename.lower().endswith((".apk", ".zip"))
    if not archive_required:
        return False
    stream.seek(0)
    if not zipfile.is_zipfile(stream):
        raise ValueError("APK/ZIP is not a valid archive")
    stream.seek(0)
    with zipfile.ZipFile(stream) as package:
        entries = package.infolist()
        if len(entries) > MAX_ENTRIES:
            raise ValueError("Archive contains too many entries")
        total = 0
        names = set()
        for info in entries:
            path = info.filename.replace("\\", "/")
            segments = path.split("/")
            if not path or path.startswith("/") or path.startswith("//") or ":" in segments[0] or ".." in segments:
                raise ValueError("Archive contains an unsafe filename")
            if info.flag_bits & 1:
                raise ValueError("Archive contains encrypted files that cannot be inspected")
            if not info.is_dir():
                total += info.file_size
                if total > MAX_UNPACKED:
                    raise ValueError("Archive declares excessive uncompressed size")
                low = path.lower()
                if low.endswith(SECRET_SUFFIXES) or low.split("/")[-1] == ".env":
                    raise ValueError("Archive appears to include a secret or signing-key file")
            names.add(path)
        if filename.lower().endswith(".apk") and "AndroidManifest.xml" not in names:
            raise ValueError("APK is missing AndroidManifest.xml")
        bad = package.testzip()
        if bad:
            raise ValueError("Archive CRC failed for " + bad)
    return True


def verify_release_asset(url, filename, expected_size, expected_sha):
    """Read complete file bytes, compare size and SHA-256, inspect archive."""
    if type(expected_size) is not int or expected_size <= 0 or expected_size > MAX_DOWNLOAD:
        raise ValueError("Unexpected GitHub release size")
    import re
    if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha):
        raise ValueError("Invalid expected SHA-256")
    if not url.startswith(
        "https://github.com/jebinc324/J-Digital-Hub/releases/download/just24-public-v1/"
    ) or not url.endswith("/" + filename):
        raise ValueError("Download URL does not belong to the approved repository")
    request = Request(url, headers={"User-Agent": "JAppsReleaseVerifier/1.0",
                                    "Accept": "application/octet-stream"})
    hashed = hashlib.sha256()
    total = 0
    with tempfile.TemporaryFile() as out:
        with urlopen(request, timeout=90) as response:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_DOWNLOAD or total > expected_size:
                    raise ValueError("Asset larger than expected")
                hashed.update(chunk)
                out.write(chunk)
        if total != expected_size or hashed.hexdigest().lower() != expected_sha.lower():
            raise ValueError("Downloaded asset size or SHA-256 differs from catalogue")
        inspected = inspect_archive(out, filename)
    return {
        "sha256VerifiedByDownload": True,
        "archiveStructureChecked": inspected,
        "checkedAt": datetime.now(timezone.utc).date().isoformat(),
        "installationTested": False,
        "malwareScanVerified": False,
    }
